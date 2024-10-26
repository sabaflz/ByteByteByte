import { StyleSheet, ViewStyle } from "react-native";
import { Image } from "expo-image";

type Props = {
    imgSource: string;
    style?: ViewStyle;
};

export default function CropImageViewer({ imgSource, style }: Props) {
    return <Image source={imgSource} style={[styles.image, style]} />;
}

const styles = StyleSheet.create({
    image: {
        width: 80,
        height: 80,
        borderRadius: 50,
    },
});
