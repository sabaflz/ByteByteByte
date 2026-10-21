import { StyleSheet } from "react-native";
import { Image, type ImageStyle } from "expo-image";

type Props = {
    imgSource: string;
    style?: ImageStyle;
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
