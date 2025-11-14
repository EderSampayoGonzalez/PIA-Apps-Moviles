//import { DeviceMotion } from 'expo-sensors';
import { Accelerometer } from 'expo-sensors';
import { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  Accelerometer.setUpdateInterval(200);

  const [motionData, setMotionData] = useState(null);

  const requestPermissionAndStartListening = async () => {
    if (motionData) {
      console.log("Ya está escuchando el acelerómetro");
      return; // Regresar si ya está escuchando
    }

    // Obtener permisos
    
    //const { status } = await DeviceMotion.getPermissionsAsync();
    const { status } = await Accelerometer.getPermissionsAsync();
    console.log('Permission status:', status);

    // Solicitar permisos si no están concedidos
    if (status !== 'granted') {
      //const { status: newStatus } = await DeviceMotion.requestPermissionsAsync();
      const { status: newStatus } = await Accelerometer.requestPermissionsAsync();
      console.log('New permission status:', newStatus);
    }

    // Verificar disponibilidad del sensor
    //const available = await DeviceMotion.isAvailableAsync();
    const available = await Accelerometer.isAvailableAsync();
    console.log('Accelerometer available:', available);
    
    // Iniciar escucha de datos del sensor
    if (available) {
      Accelerometer.addListener((data) => {
        //console.log(data);
        let x = data.x;
        let y = data.y - 1; // Ajustar para gravedad
        let z = data.z;

        /*if (x > 1){
          console.log("Movimiento fuerte a la derecha");
        }
        if (x < -1){
          console.log("Movimiento fuerte a la izquierda");
        }
        if (y > 1){
          console.log("Movimiento fuerte hacia arriba");
        }
        if (y < -1){
          console.log("Movimiento fuerte hacia abajo");
        }
        if (z > 1){
          console.log("Movimiento fuerte hacia adelante");
        }
        if (z < -1){
          console.log("Movimiento fuerte hacia atrás");
        }*/
        
        //Lógoica para detectar sacudidas (Solo hacia arriba/abajo)
        if (data.y >= 1.2 || data.y <= -1.2) {
          console.log("se agitó fuerte el celular");
        }
        else if (data.y >= 1.0 || data.y <= -1.0) {
          console.log("se agitó el celular");
        }

        setMotionData(data);
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <Button 
        title="Activar Acelerómetro" 
        onPress={requestPermissionAndStartListening}
      />
      <Button
        title="Desactivar Acelerómetro"
        onPress={() => {
          Accelerometer.removeAllListeners();
          setMotionData(null);
        }}
      />
      {motionData && <Text>Motion data received!</Text>}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

