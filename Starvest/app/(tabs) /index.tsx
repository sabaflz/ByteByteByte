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
      <View style={styles.Container}>
        <Button label="Weather" />
      </View>
      <View style={styles.gridContainer}>
        <Button label="Crop 1" />
        <Button label="Crop 2" />
        <Button label="Crop 3" />
        <Button label="Crop 4" />
      </View>


      {/* <View style={styles.footerContainer}>
        <Button label="Crop 1" />
      </View>
      <View style={styles.footerContainer}>
        <Button label="Crop 2" />
      </View>
      <View style={styles.footerContainer}>
        <Button label="Crop 3" />
      </View>
      <View style={styles.footerContainer}>
        <Button label="Crop 4" />
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    color: '000',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  footerContainer: {
    flexBasis: '45%', // Each button takes 45% of the row width
    marginBottom: 20, // Space between rows
    alignItems: 'center',
  },
});
