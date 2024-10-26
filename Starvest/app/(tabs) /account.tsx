import { Text, View, StyleSheet } from 'react-native';

import ImageViewer from "@/components/ImageViewer";

const PlaceholderImage = require('@/assets/images/farmer.png');

export default function AccountScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <ImageViewer imgSource={PlaceholderImage} />
      </View>
      <View>
        <Text style={styles.text}>Mr. McDonald</Text>
      </View>
      <View>
        <Text style={styles.text}>(828)271-4800</Text>
      </View>
      <View>
        <Text style={styles.text}>mc.farm@gmail.com</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  text: {
    color: '#000',
    textAlign: 'center',
    // top: 10,
    paddingBottom: 20,

  },
});