/**
 * Configuration de l'API — connexion au backend Django.
 */

// Adresse du backend selon l'environnement.
// Sur un émulateur Android, localhost = 10.0.2.2
// Sur un appareil physique, utiliser l'IP locale du PC.
import { Platform } from 'react-native';

// 🔧 Change cette IP si tu testes sur un appareil physique
const PHYSICAL_DEVICE_IP = '192.168.1.100';

const getBaseURL = () => {
  if (__DEV__) {
    // En développement
    if (Platform.OS === 'android') {
      // Émulateur Android : 10.0.2.2 pointe vers localhost du PC
      return 'http://10.0.2.2:8001/api';
    }
    // iOS simulator ou web : localhost fonctionne
    return 'http://localhost:8001/api';
  }
  // Production
  return 'https://l1tello-production.up.railway.app/api';
};

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  TIMEOUT: 15000, // 15 secondes
};

export default API_CONFIG;
