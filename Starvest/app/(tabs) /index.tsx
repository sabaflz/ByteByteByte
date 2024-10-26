import { Text, View, StyleSheet, Image } from 'react-native'; // 
import { useState } from 'react';

import Button from '@/components/Button';

// Define interface for the weather API response
interface WeatherData {
  hourly: {
    temperature_2m: number[];
    precipitation_probability: number[];
    wind_speed_10m: number[];
    time: string[];
  };
  hourly_units: {
    temperature_2m: string;
    precipitation_probability: string;
    wind_speed_10m: string;
  };
}

const PlaceholderImage = require('@/assets/images/background-image.png');

export default function Index() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iconUrl, setIconUrl] = useState<string | null>(null); // 

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

      //
      const iconResponse = await fetch(
        'https://api.openweathermap.org/data/2.5/weather?lat=52.52&lon=13.41&appid=a5166d630224309d6598970cb1680515'
      ); // 
      const iconData = await iconResponse.json(); //
      const iconCode = iconData.weather[0].icon; //
      setIconUrl(`https://openweathermap.org/img/wn/${iconCode}@2x.png`); // 

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
      const currentPrecip = weatherData.hourly.precipitation_probability[currentHourIndex];
      const currentWind = weatherData.hourly.wind_speed_10m[currentHourIndex];

      return (
        <View style={styles.weatherContainer}>
          <Text style={styles.weatherText}>Current Temperature: {currentTemp}°C</Text>
          <Text style={styles.weatherText}>Precipitation Chance: {currentPrecip}%</Text>
          <Text style={styles.weatherText}>Wind Speed: {currentWind} mph</Text>
          {iconUrl && <Image source={{ uri: iconUrl }} style={styles.weatherIcon} />} {/* Display the icon if available */}
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {renderWeatherData()}
      <View style={styles.footerContainer}>
        <Button label="Weather" onPress={fetchWeather} />
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
      <View style={styles.footerContainer}>
        <Button label="Crop 4" />
      </View>
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
    flex: 1 / 3,
    alignItems: 'center',
  },
  weatherContainer: {
    padding: 20,
    margin: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    width: '80%',
  },
  weatherText: {
    fontSize: 16,
    marginVertical: 5,
    textAlign: 'center',
  },
  weatherIcon: {
    width: 100,
    height: 100,
    marginTop: 10,
  }, 
  errorText: {
    color: 'red',  //
    fontSize: 16,   //
    textAlign: 'center',  //
    margin: 10,  //
  },
});
