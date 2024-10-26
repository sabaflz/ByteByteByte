import { Text, View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Image } from 'expo-image';

import Button from '@/components/Button';
// import ImageViewer from "@/components/ImageViewer";

const PlaceholderImage = require('@/assets/images/background-image.png');

export default function Index() {
  return (
    <View style={styles.container}>
      {/* <View style={styles.imageContainer}>
        <ImageViewer imgSource={PlaceholderImage} />
      </View> */}
      <View style={styles.footerContainer}>
        <Button label="Weather" />
      </View>
      <View style={styles.footerContainer}>
        <Button label="Crop 1" />
      </View>
      <View style={styles.footerContainer}>
        <Button label="Crop 2" />
      </View>
      <View style={styles.footerContainer}>
        <Button label="Crop 3" />
      </View>
      {/* <View style={styles.footerContainer}>
        <Button label="Weather" />
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#376443',
     alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
  },
  footerContainer: {
    flex: 1 / 3,
    alignItems: 'center',
  },
});
