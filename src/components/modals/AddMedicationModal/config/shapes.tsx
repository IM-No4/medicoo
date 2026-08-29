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

// Gives the flat pill shapes a raised, 3D look instead of a solid color
// block - applied to the actual colored View (not a transparent wrapper) so
// both iOS's shadow (which follows the view's own borderRadius) and
// Android's elevation (which needs an opaque background to draw against)
// render correctly.
export const PILL_SHADOW = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
} as const;

export const SHAPES = [
    // Common
    {
        key: 'capsule',
        label: 'Capsule',
        type: 'capsule', // Special handling for split colors
        render: (color: string) => <View style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: color, ...PILL_SHADOW }} />
    },
    {
        key: 'round',
        label: 'Round',
        type: 'solid',
        render: (color: string) => <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: color, ...PILL_SHADOW }} />
    },
    {
        key: 'oval',
        label: 'Oval',
        type: 'solid',
        render: (color: string) => <View style={{ width: 46, height: 30, borderRadius: 20, backgroundColor: color, ...PILL_SHADOW }} />
    },
    {
        key: 'tablet',
        label: 'Tablet',
        type: 'solid',
        render: (color: string) => <View style={{ width: 40, height: 20, borderRadius: 6, backgroundColor: color, ...PILL_SHADOW }} />
    },

    // More
    {
        key: 'square',
        label: 'Square',
        type: 'solid',
        render: (color: string) => <View style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: color, ...PILL_SHADOW }} />
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
        render: (color: string) => <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: color, ...PILL_SHADOW }} />
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
                <View style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: primaryColor, ...PILL_SHADOW }} />
            </View>
        );
    }

    // Special Capsule Handling (Split Colors) - the split-color halves need
    // overflow:hidden to clip cleanly, but that also clips any shadow drawn
    // on that same view, so the shadow lives on this extra outer wrapper
    // instead (sized/rounded to match, with an opaque backdrop so Android's
    // elevation has something to draw against).
    if (config.key === 'capsule') {
        const rColor = rightColor || primaryColor;
        const width = 44 * size;
        const height = 24 * size;
        const radius = 12 * size;
        return (
            <View style={{ width, height, borderRadius: radius, backgroundColor: primaryColor, ...PILL_SHADOW }}>
                <View style={{ flexDirection: 'row', width, height, borderRadius: radius, overflow: 'hidden' }}>
                    <View style={{ flex: 1, backgroundColor: primaryColor }} />
                    <View style={{ flex: 1, backgroundColor: rColor }} />
                </View>
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
