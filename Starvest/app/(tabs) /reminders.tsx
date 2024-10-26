import { Text, View, StyleSheet } from 'react-native';

export default function RemindersScreen() {
  return (
    <View style={styles.container}>
      {/* <Text style={styles.title}>Tips</Text> */}
      <Text style={styles.text}>Reminders screen</Text>
      <Text style={styles.text}>Reminders screen</Text>
      <Text style={styles.text}>Reminders screen</Text>
      <Text style={styles.text}>Reminders screen</Text>
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
    // backgroundColor: 'red',
    borderRadius: 20,
    // borderColor: 'red',
  },
});
