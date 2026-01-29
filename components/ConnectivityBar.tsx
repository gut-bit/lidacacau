import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Animated, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { Colors, Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ConnectivityBar() {
    const [isConnected, setIsConnected] = useState<boolean | null>(true);
    const [visible, setVisible] = useState(false);
    const translateY = useState(new Animated.Value(-100))[0];
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state: any) => {
            const connected = state.isConnected && (state.isInternetReachable !== false);
            setIsConnected(connected);

            if (connected === false) {
                showBar();
            } else if (connected === true && visible) {
                hideBar();
            }
        });

        return () => unsubscribe();
    }, [visible]);

    const showBar = () => {
        setVisible(true);
        Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
        }).start();
    };

    const hideBar = () => {
        // Show "Back online" briefly before hiding
        setTimeout(() => {
            Animated.timing(translateY, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setVisible(false));
        }, 2000);
    };

    if (!visible && isConnected) return null;

    const bgColor = isConnected ? '#4CAF50' : '#F44336';
    const icon = isConnected ? 'wifi' : 'wifi-off';
    const message = isConnected ? 'Conexao restabelecida' : 'Sem conexao com a internet';

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: bgColor,
                    paddingTop: Platform.OS === 'ios' ? insets.top : Spacing.md,
                    transform: [{ translateY }]
                }
            ]}
        >
            <View style={styles.content}>
                <Feather name={icon} size={16} color="#FFFFFF" />
                <ThemedText type="small" style={styles.text}>
                    {message}
                </ThemedText>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingBottom: Spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    text: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});
