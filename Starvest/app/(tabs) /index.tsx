import { Text, View, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FontAwesome5 } from 'react-native-vector-icons';
import ImageViewer from "@/components/ImageViewer";
import CropImageViewer from "@/components/CropImageViewer";


// import Button from '@/components/Button';

// Define interface for the weather API response
interface WeatherData {
  hourly: {
    temperature_2m: number[];
    precipitation_probability: number[]; //
    wind_speed_10m: number[]; // 
    time: string[];
  };
  hourly_units: {
    temperature_2m: string;
    precipitation_probability: string;  //
    wind_speed_10m: string; //
  };
}

const PlaceholderImage = require('@/assets/images/background-image.png');

export default function Index() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=temperature_2m,precipitation_probability,wind_speed_10m' 
      );
      
      if (!response.ok) {
        throw new Error('Weather data fetch failed');
      }
      
      const data: WeatherData = await response.json();
      setWeatherData(data);
    } catch (err) {
      setError('Failed to fetch weather data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderWeatherData = () => {
    if (loading) {
      return <Text style={styles.weatherText}>Loading weather data...</Text>;
    }

    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }

    if (weatherData) {
      const currentHourIndex = new Date().getHours();
      const currentTemp = weatherData.hourly.temperature_2m[currentHourIndex];
      const currentPrecip = weatherData.hourly.precipitation_probability[currentHourIndex]; //
      const currentWind = weatherData.hourly.wind_speed_10m[currentHourIndex];  // 

      return (
        <View style={styles.weatherContainer}>
          <Text style={styles.weatherText}><Ionicons name={'thermometer-outline'} color={'#376443'} size={24} />{currentTemp}°C</Text>
          <Text style={styles.weatherText}><Ionicons name={'water-outline'} color={'#376443'} size={24} /> {currentPrecip}%</Text> 
          <Text style={styles.weatherText}><FontAwesome5 name="wind" size={24} color={'#376443'} /> {currentWind} mph</Text>
        </View>
      );
    }

    return null;
  };

  // images for the crops
  const crop1 = require('@/assets/images/sugarcane.png');
  const crop2 = require('@/assets/images/potato.png');
  const crop3 = require('@/assets/images/wheat.png');
  const crop4 = require('@/assets/images/corn.png');

  return (
    <View style={styles.container}>
      {renderWeatherData()}
      <View style={styles.footerContainer}>
        <View style={styles.buttonContainer}>
          <Pressable style={styles.button} onPress={fetchWeather}>
            <Text style={styles.buttonLabelweather}>{'Weather'}</Text>
          </Pressable>
        </View>
      </View>
      {/* <View style={styles.footerContainer}> */}

      <View style={styles.buttonContainer}>
        <View style={styles.pairContainer}>
          <Pressable style={styles.button} onPress={fetchWeather}>
            <CropImageViewer style={styles.crops} imgSource={crop1} />
            <Text style={styles.buttonLabel}>Crop 1</Text>
          </Pressable>
        </View>
        <View style={styles.pairContainer}>
          <Pressable style={styles.button} onPress={fetchWeather}>
            <CropImageViewer style={styles.crops} imgSource={crop2} />
            <Text style={styles.buttonLabel}>Crop 2</Text>
          </Pressable>
        </View>
        <View style={styles.pairContainer}>
          <Pressable style={styles.button} onPress={fetchWeather}>
            <CropImageViewer style={styles.crops} imgSource={crop3} />
            <Text style={styles.buttonLabel}>Crop 3</Text>
          </Pressable>
        </View>
      </View>
      {/* </View> */}
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
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
  },
  footerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
  },
  weatherContainer: {
    padding: 10,
    margin: 10,
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    width: '80%',
  },
  weatherText: {
    fontSize: 16,
    marginVertical: 5,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    margin: 10,
  },
  // buttonContainer: {
  //   width: 320,
  //   height: 68,
  //   marginHorizontal: 20,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   padding: 3,
  // },
  buttonContainer: {
    width: '100%',
    padding: 10,
    justifyContent: 'center',
  },
  button: {
    borderRadius: 10,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonIcon: {
    paddingRight: 8,
  },
  buttonLabelweather: {
    color: '#000',
    fontSize: 16,
    textAlign: 'center',
  },
  buttonLabel: {
    color: '#000',
    fontSize: 16,
  },
  pairContainer: {
    flexDirection: 'row',      // Ensures image and text are side by side
    alignItems: 'center',      // Aligns image and text vertically
    marginBottom: 10,          // Adds spacing between pairs
  },
  crops: {
    width: 50,                 // Adjust image size
    height: 50,
    marginRight: 20,           // Adds space between image and text
  },
  // crops: {
  //   width: 20,
  //   height: 18,
  //   marginHorizontal: 20,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   padding: 3,
  // },
});