import { Text, View, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import CropImageViewer from "@/components/CropImageViewer";
import { Modal } from 'react-native';
import {
  type Conditions,
  type Recommendations,
  type Risk,
  fetchConditions,
  fetchRecommendations,
} from '@/lib/api';
import { useFarmLocation } from '@/hooks/useFarmLocation';

// Add this new import at the top of the file
const PopupImage1 = require('@/assets/images/SugarCaneDes.png');
const PopupImage2 = require('@/assets/images/PotatoDes.png');
const PopupImage3 = require('@/assets/images/WheatDes.png');

const RISK_COLORS: Record<Risk, string> = { low: '#376443', moderate: '#c98a1b', high: '#b3261e' };
const SUITABILITY_COLORS = { good: '#376443', fair: '#c98a1b', poor: '#b3261e' } as const;

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/** WMO weather code (Open-Meteo) -> Ionicons name. */
function weatherIcon(code: number | null): keyof typeof Ionicons.glyphMap {
  if (code === null) return 'cloud-outline';
  if (code === 0) return 'sunny-outline';
  if (code <= 3) return 'partly-sunny-outline';
  if (code === 45 || code === 48) return 'cloudy-outline';
  if (code >= 95) return 'thunderstorm-outline';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow-outline';
  return 'rainy-outline';
}

export default function Index() {
  const location = useFarmLocation();
  const [conditions, setConditions] = useState<Conditions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advice, setAdvice] = useState<Recommendations | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);

  const loadConditions = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    setError(null);
    try {
      setConditions(await fetchConditions(location.lat, location.lon));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    void loadConditions();
  }, [loadConditions]);

  const loadAdvice = async () => {
    if (!location) return;
    setAdviceLoading(true);
    setAdviceError(null);
    try {
      setAdvice(await fetchRecommendations(location.lat, location.lon));
    } catch (err) {
      setAdviceError(err instanceof Error ? err.message : 'Could not get recommendations');
    } finally {
      setAdviceLoading(false);
    }
  };

  const renderWeatherData = () => {
    if (!location || (loading && !conditions)) {
      return <Text style={styles.weatherText}>Loading weather data...</Text>;
    }

    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }

    if (conditions) {
      const { current, daily } = conditions.weather;
      const soil = conditions.soil;

      return (
        <View>
          <Text style={styles.locationText}>{location.label}</Text>
          <Ionicons name={weatherIcon(current.weather_code)} size={44} color={'#376443'} style={styles.weatherIcon} />
          <Text style={styles.weatherText}><Ionicons name={'thermometer-outline'} color={'#376443'} size={24} />{current.temperature_c}°C</Text>
          <Text style={styles.weatherText}><Ionicons name={'water-outline'} color={'#376443'} size={24} /> {current.humidity_pct}% humidity · {daily.precipitation_mm[0] ?? 0} mm rain today</Text>
          <Text style={styles.weatherText}><FontAwesome5 name="wind" size={24} color={'#376443'} /> {current.wind_mph} mph</Text>
          {soil?.root_zone_soil_wetness != null && (
            <Text style={styles.weatherText}>
              <Ionicons name={'leaf-outline'} color={'#376443'} size={24} /> Soil moisture {Math.round(soil.root_zone_soil_wetness * 100)}% · {soil.precipitation_total_mm} mm rain in {soil.period_days} days (NASA)
            </Text>
          )}
        </View>
      );
    }

    return null;
  };

  const renderPestRisk = () => {
    if (!conditions) return null;
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Disease risk this week</Text>
        {conditions.pest_risk.map((r) => (
          <View key={r.crop} style={styles.riskRow}>
            <Text style={styles.riskCrop}>{capitalize(r.crop)} · {r.threat}</Text>
            <Text style={[styles.badge, { backgroundColor: RISK_COLORS[r.risk] }]}>{r.risk}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderAdvice = () => {
    if (adviceLoading) return <ActivityIndicator color="#376443" style={{ margin: 10 }} />;
    if (adviceError) return <Text style={styles.errorText}>{adviceError}</Text>;
    if (!advice) return null;
    const { summary, crops, soil_treatments } = advice.recommendations;
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Crop advice {advice.source === 'openai' ? '(AI)' : '(rule-based)'}
        </Text>
        <Text style={styles.adviceText}>{summary}</Text>
        {crops.map((c) => (
          <View key={c.crop} style={styles.adviceItem}>
            <Text style={[styles.badge, { backgroundColor: SUITABILITY_COLORS[c.suitability] }]}>{c.suitability}</Text>
            <Text style={styles.adviceText}><Text style={styles.bold}>{c.crop}: </Text>{c.reason}</Text>
          </View>
        ))}
        <Text style={[styles.cardTitle, { marginTop: 8 }]}>Soil</Text>
        {soil_treatments.map((t) => (
          <Text key={t.action} style={styles.adviceText}><Text style={styles.strong}>{t.action}: </Text>{t.reason}</Text>
        ))}
      </View>
    );
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
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Image shows up regarding to the weather */}
      <View style={styles.weatherContainer}>
        {renderWeatherData()}
      </View>
      {/* <View style={styles.footerContainer}> */}
        <View style={styles.buttonContainer}>
          <Pressable style={styles.button} onPress={loadConditions} disabled={loading}>
            <Text style={styles.buttonLabelweather}>{loading ? 'Refreshing...' : 'Refresh weather'}</Text>
          </Pressable>
        </View>

      {renderPestRisk()}

      <View style={styles.buttonContainer}>
        <Pressable style={styles.button} onPress={loadAdvice} disabled={!location || adviceLoading}>
          <Text style={styles.buttonLabelweather}>{'Get crop advice'}</Text>
        </Pressable>
      </View>
      {renderAdvice()}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingBottom: 24,
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
  locationText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    width: '90%',
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#376443',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#376443',
    marginBottom: 6,
  },
  riskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  riskCrop: {
    fontSize: 15,
    flexShrink: 1,
  },
  badge: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
    textTransform: 'uppercase',
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  adviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: 4,
  },
  adviceText: {
    fontSize: 15,
    flexShrink: 1,
    marginVertical: 2,
  },
  bold: {
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  strong: {
    fontWeight: 'bold',
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
