import { Text, View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FontAwesome5 } from 'react-native-vector-icons';
import ImageViewer from "@/components/ImageViewer";
import CropImageViewer from "@/components/CropImageViewer";
import { Modal } from 'react-native';

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

// Add this new import at the top of the file
const PopupImage1 = require('@/assets/images/SugarCaneDes.png');
const PopupImage2 = require('@/assets/images/PotatoDes.png');
const PopupImage3 = require('@/assets/images/WheatDes.png');


export default function Index() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iconUrl, setIconUrl] = useState<string | null>(null); // 
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);

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

      const iconResponse = await fetch(
        'https://api.openweathermap.org/data/2.5/weather?lat=52.52&lon=13.41&appid=a5166d630224309d6598970cb1680515'
      ); //
      const iconData = await iconResponse.json(); //
      const iconCode = iconData.weather[0].icon; //
      const iconDescription = iconData.weather[0].description; //
      setIconUrl(`https://openweathermap.org/img/wn/${iconCode}@2x.png`); // 

    } catch (err) {
      setError('Failed to fetch weather data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const crop1Function = () => {
    return (
      <CropImageViewer imgSource={crop1} />
    );
    console.log('crop1');
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
          <View style={styles.weatherIcon}>
            <Text style={styles.weatherText}>{iconUrl && (<Image source={{ uri: iconUrl }} style={styles.weatherIcon} />)}</Text>
          </View>
          {/* <Text style={styles.weatherText}>{iconDescription}</Text> */}
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

  const openCropModal1 = () => {
    setSelectedCrop(PopupImage1);
  };
  const openCropModal2 = () => {
    setSelectedCrop(PopupImage2);
  };
  const openCropModal3 = () => {
    setSelectedCrop(PopupImage3);
  };

  const closeCropModal = () => {
    setSelectedCrop(null);
  };

  return (
    <View style={styles.container}>
      {/* Image shows up regarding to the weather */}
      <View style={styles.weatherContainer}>
        {renderWeatherData()}
      </View>
      {/* <View style={styles.footerContainer}> */}
        <View style={styles.buttonContainer}>
          <Pressable style={styles.button} onPress={fetchWeather}>
            <Text style={styles.buttonLabelweather}>{'Weather'}</Text>
          </Pressable>
        </View>
      {/* </View> */}
      {/* <View style={styles.footerContainer}> */}

      <View style={styles.buttonContainer}>
        <View style={styles.pairContainer}>
          <Pressable style={styles.button} onPress={openCropModal1}>
            <CropImageViewer style={styles.crops} imgSource={crop1} />
            <Text style={styles.buttonLabel}>Sugar Cane</Text>
          </Pressable>
        </View>
        <View style={styles.pairContainer}>
          <Pressable style={styles.button} onPress={openCropModal2}>
            <CropImageViewer style={styles.crops} imgSource={crop2} />
            <Text style={styles.buttonLabel}>Potatoes</Text>
          </Pressable>
        </View>
        <View style={styles.pairContainer}>
          <Pressable style={styles.button} onPress={openCropModal3}>
            <CropImageViewer style={styles.crops} imgSource={crop3} />
            <Text style={styles.buttonLabel}>Wheat</Text>
          </Pressable>
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={selectedCrop !== null}
        onRequestClose={closeCropModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Pressable style={styles.closeButton} onPress={closeCropModal}>
              <Ionicons name="close" size={24} color="white" />
            </Pressable>
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
            >
              {selectedCrop && (
                <View style={styles.imageContainer}>
                  <Image source={selectedCrop} style={styles.modalImage} />
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    // marginTop: -20,
    // borderWidth: 1,
    // borderColor: '#376443',
  },
  weatherContainer: {
    padding: 10,
    margin: 10,
    // flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    // borderWidth: 1,
    // borderColor: '#376443',
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
    // borderWidth: 1,
    // borderColor: '#376443',
  },
  button: {
    borderRadius: 10,
    width: '100%',
    // height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    // borderWidth: 1,
    // borderColor: '#376443',
  },
  buttonIcon: {
    paddingRight: 8,
  },
  buttonLabelweather: {
    color: '#376443',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#376443',
    padding: 5,
    borderRadius: 5,
    
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
  weatherIcon: {
    width: 50,  // Adjust the size of the icon
    height: 50,
    flexDirection: 'row',
    // borderWidth: 1,
    // borderColor: '#376443',
    alignSelf: 'center', // Center the icon
    // alignSelf: 'center', // Center the icon
    marginTop: 10,  // Add some spacing from the text
  },
  // crops: {
  //   width: 20,
  //   height: 18,
  //   marginHorizontal: 20,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   padding: 3,
  // },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '95%',
    height: '95%',
    position: 'relative',
  },
  scrollView: {
    width: '100%',
    height: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  imageContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalImage: {
    width: 321,
    height: 699,
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#376443',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // Ensure the button is above the image
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
