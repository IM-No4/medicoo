import {
    Diamond,
    Droplet,
    Hexagon,
    Octagon,
    Pentagon,
    Syringe,
    Triangle
} from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

export const SHAPES = [
    // Common
    {
        key: 'capsule',
        label: 'Capsule',
        type: 'capsule', // Special handling for split colors
        render: (color: string) => <View style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: color }} />
    },
    {
        key: 'round',
        label: 'Round',
        type: 'solid',
        render: (color: string) => <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: color }} />
    },
    {
        key: 'oval',
        label: 'Oval',
        type: 'solid',
        render: (color: string) => <View style={{ width: 46, height: 30, borderRadius: 20, backgroundColor: color }} />
    },
    {
        key: 'tablet',
        label: 'Tablet',
        type: 'solid',
        render: (color: string) => <View style={{ width: 40, height: 20, borderRadius: 6, backgroundColor: color }} />
    },

    // More
    {
        key: 'square',
        label: 'Square',
        type: 'solid',
        render: (color: string) => <View style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: color }} />
    },
    { key: 'diamond', label: 'Diamond', Icon: Diamond, type: 'icon' },
    { key: 'triangle', label: 'Triangle', Icon: Triangle, type: 'icon' },
    { key: 'liquid', label: 'Liquid', Icon: Droplet, type: 'icon' },
    {
        key: 'cream',
        label: 'Cream',
        type: 'render',
        render: (color: string) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 12, height: 6, backgroundColor: color, marginBottom: 1 }} />
                <View style={{ width: 22, height: 26, backgroundColor: color, borderTopLeftRadius: 4, borderTopRightRadius: 4, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 }} />
            </View>
        )
    },
    { key: 'injection', label: 'Injection', Icon: Syringe, type: 'icon' },
    { key: 'pentagon', label: 'Pentagon', Icon: Pentagon, type: 'icon' },
    { key: 'hexagon', label: 'Hexagon', Icon: Hexagon, type: 'icon' },
    { key: 'octagon', label: 'Octagon', Icon: Octagon, type: 'icon' },
    {
        key: 'rounded_square',
        label: 'Soft Square',
        type: 'solid',
        render: (color: string) => <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: color }} />
    },
];

export const getShapeConfig = (key: string) => SHAPES.find(s => s.key === key);

interface RenderShapeProps {
    shapeKey: string;
    leftColor?: string;
    rightColor?: string;
    size?: number; // Scale factor?
}

export const RenderMedicationIcon = ({ shapeKey, leftColor, rightColor, size = 1 }: RenderShapeProps) => {
    const config = getShapeConfig(shapeKey);
    const primaryColor = leftColor || '#FFF';

    if (!config) {
        // Default Pill
        return (
            <View style={{ transform: [{ scale: size }] }}>
                <View style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: primaryColor }} />
            </View>
        );
    }

    // Special Capsule Handling (Split Colors)
    if (config.key === 'capsule') {
        const rColor = rightColor || primaryColor;
        return (
            <View style={{ flexDirection: 'row', width: 44 * size, height: 24 * size, borderRadius: 12 * size, overflow: 'hidden' }}>
                <View style={{ flex: 1, backgroundColor: primaryColor }} />
                <View style={{ flex: 1, backgroundColor: rColor }} />
            </View>
        );
    }

    return (
        <View style={{ transform: [{ scale: size }] }}>
            {config.render ? (
                config.render(primaryColor)
            ) : (
                config.Icon && <config.Icon size={32} color={primaryColor} fill={primaryColor} />
            )}
        </View>
    );
};
