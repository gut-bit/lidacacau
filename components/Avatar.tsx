import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Colors } from '@/constants/theme';

interface AvatarProps {
    uri?: string | null;
    name?: string;
    size?: number;
    style?: StyleProp<ViewStyle>;
    borderColor?: string;
    borderWidth?: number;
}

export function Avatar({
    uri,
    name,
    size = 40,
    style,
    borderColor,
    borderWidth = 0
}: AvatarProps) {
    const { theme, isDark } = useTheme();
    const colors = isDark ? Colors.dark : Colors.light;

    const initials = name
        ? name
            .split(' ')
            .slice(0, 2)
            .map(n => n[0])
            .join('')
            .toUpperCase()
        : '?';

    // Deterministic color based on name
    const getRandomColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00ffffff).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    };

    const backgroundColor = name ? getRandomColor(name) : colors.primary;

    const containerStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth,
        borderColor: borderColor || 'transparent',
        backgroundColor: uri ? colors.card : backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    } as ViewStyle;

    if (uri) {
        return (
            <View style={[containerStyle, style]}>
                <Image
                    source={{ uri }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    transition={200}
                />
            </View>
        );
    }

    return (
        <View style={[containerStyle, style]}>
            <ThemedText
                type="body"
                style={{
                    color: '#FFFFFF',
                    fontWeight: '700',
                    fontSize: size * 0.4
                }}
            >
                {initials}
            </ThemedText>
        </View>
    );
}
