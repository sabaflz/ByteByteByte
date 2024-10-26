import { StyleSheet } from "react-native";
import { Image } from "expo-image";

type Props = {
    imgSource: string;
  };
  
  export default function ImageViewer({ imgSource }: Props) {
    return <Image source={imgSource} style={styles.image} />;
  }

const styles = StyleSheet.create({
       image: {
        // top: 10,
        // bottom: 10,
        // left: 90,
        width: 80,                 // Adjust image size
        height: 80,
        // width: 350,
        // height: 540,
        borderRadius: 50,
      },
});