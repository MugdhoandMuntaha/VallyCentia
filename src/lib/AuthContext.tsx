'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, AuthError } from '@supabase/supabase-js';

/* ===== Types ===== */
export type UserRole = 'customer' | 'admin';

export interface UserProfile {
    full_name: string | null;
    display_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    date_of_birth: string | null;
    gender: string | null;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    role: UserRole;
    profile: UserProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>;
    signInWithGoogle: () => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    updateProfile: (updates: Partial<Omit<UserProfile, 'role'>>) => Promise<{ error: string | null }>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ===== Provider ===== */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>('customer');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const initialLoadDone = useRef(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const supabase = useMemo(() => createClient(), []);

    // Fetch full profile from user_profiles table
    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('full_name, display_name, phone, avatar_url, date_of_birth, gender, role')
                .eq('id', userId)
                .single();

            if (!error && data) {
                const userProfile: UserProfile = {
                    full_name: data.full_name,
                    display_name: data.display_name,
                    phone: data.phone,
                    avatar_url: data.avatar_url,
                    date_of_birth: data.date_of_birth,
                    gender: data.gender,
                    role: (data.role as UserRole) || 'customer',
                };
                setProfile(userProfile);
                setRole(userProfile.role);
            } else {
                setProfile(null);
                setRole('customer');
            }
        } catch {
            setProfile(null);
            setRole('customer');
        }
    }, [supabase]);

    useEffect(() => {
        // Get initial session — only this handles the first load
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            setUser(user);
            if (user) {
                await fetchProfile(user.id);
            }
            initialLoadDone.current = true;
            setLoading(false);
        }).catch(() => {
            initialLoadDone.current = true;
            setLoading(false);
        });

        // Listen for auth changes AFTER initial load
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                // Skip events until getUser() has finished to avoid race condition
                if (!initialLoadDone.current) return;

                const currentUser = session?.user ?? null;

                if (currentUser) {
                    // Fetch profile BEFORE updating state to avoid intermediate
                    // state where user is set but role is still 'customer'
                    try {
                        const { data, error } = await supabase
                            .from('user_profiles')
                            .select('full_name, display_name, phone, avatar_url, date_of_birth, gender, role')
                            .eq('id', currentUser.id)
                            .single();

                        if (!error && data) {
                            const userProfile: UserProfile = {
                                full_name: data.full_name,
                                display_name: data.display_name,
                                phone: data.phone,
                                avatar_url: data.avatar_url,
                                date_of_birth: data.date_of_birth,
                                gender: data.gender,
                                role: (data.role as UserRole) || 'customer',
                            };
                            setProfile(userProfile);
                            setRole(userProfile.role);
                        }
                    } catch {
                        // Keep existing profile/role on error
                    }
                    setUser(currentUser);
                } else {
                    setUser(null);
                    setRole('customer');
                    setProfile(null);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, [supabase.auth, fetchProfile]);

    const signIn = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    }, [supabase.auth]);

    const signUp = useCallback(async (email: string, password: string, name: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name },
            },
        });
        return { error };
    }, [supabase.auth]);

    const signInWithGoogle = useCallback(async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        return { error };
    }, [supabase.auth]);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
        setRole('customer');
        setProfile(null);
    }, [supabase.auth]);

    // Update profile fields in user_profiles table
    const updateProfile = useCallback(async (updates: Partial<Omit<UserProfile, 'role'>>) => {
        if (!user) return { error: 'Not authenticated' };

        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', user.id);

            if (error) {
                return { error: error.message };
            }

            // Refresh the local profile state
            await fetchProfile(user.id);
            return { error: null };
        } catch (err) {
            return { error: err instanceof Error ? err.message : 'Failed to update profile' };
        }
    }, [user, supabase, fetchProfile]);

    // Allow manual refresh of profile
    const refreshProfile = useCallback(async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    }, [user, fetchProfile]);

    return (
        <AuthContext.Provider value={{
            user, role, profile, loading,
            signIn, signUp, signInWithGoogle, signOut,
            updateProfile, refreshProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

/* ===== Hook ===== */
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
