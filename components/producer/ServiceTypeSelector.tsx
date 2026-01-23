import React from 'react';
import { StyleSheet, ScrollView, Pressable, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { SERVICE_TYPES } from '@/data/serviceTypes';

interface ServiceTypeSelectorProps {
    selectedId: string;
    onSelect: (id: string) => void;
}

export function ServiceTypeSelector({ selectedId, onSelect }: ServiceTypeSelectorProps) {
    const { isDark } = useTheme();
    const colors = isDark ? Colors.dark : Colors.light;

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {SERVICE_TYPES.map((service) => {
                const isSelected = selectedId === service.id;
                return (
                    <Pressable
                        key={service.id}
                        style={[
                            styles.chip,
                            {
                                backgroundColor: isSelected ? colors.primary : colors.backgroundDefault,
                                borderColor: colors.border,
                            },
                        ]}
                        onPress={() => onSelect(service.id)}
                    >
                        <Feather
                            name={service.icon as any}
                            size={18}
                            color={isSelected ? '#FFFFFF' : colors.text}
                        />
                        <ThemedText
                            type="small"
                            style={{ color: isSelected ? '#FFFFFF' : colors.text }}
                        >
                            {service.name}
                        </ThemedText>
                    </Pressable>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
});
