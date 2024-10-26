import { Text, View, StyleSheet } from 'react-native';

export default function RemindersScreen() {
  return (
    <View style={styles.container}>
      {/* <Text style={styles.title}>Tips</Text> */}
      <Text style={styles.text}>1. Irrigation scheduled for Field A at 6:00 AM</Text>
      <Text style={styles.text}>2. Apply Pest prevention treatment to Crop B on October. 28</Text>
      <Text style={styles.text}>3. Monitor Soil Moisture levels tomorrow at 8:00 AM. </Text>
      <Text style={styles.text}>4. Check weather forecast for potential rain next Tuesday</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#000',
    padding: 10,
  },
  text: {
    color: '#000',
    padding: 30,
    width: '80%',
    textAlign: 'center',
    // backgroundColor: 'red',
    borderRadius: 20,
    // borderColor: 'red',
  },
});
