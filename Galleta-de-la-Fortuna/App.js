import { Accelerometer } from 'expo-sensors';
import { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAudioPlayer } from 'expo-audio';

const cookieCrackSound = require('./assets/galleta1.mp3');

export default function App() {
  //Configuraciones del acelerómetro
  Accelerometer.setUpdateInterval(200);
  const [motionData, setMotionData] = useState(null);

  // Configuraciones de la galleta de la fortuna
  let [hp, setHp] = useState(30);
  const [boxColor, setBoxColor] = useState('skyblue');
  const audioPlayer = useAudioPlayer(cookieCrackSound);

  const reproducirSonido = () => {
    //no reproducir si el audioPlayer no está listo o está reproduciendo
    if (!audioPlayer || audioPlayer.paused === false) {
      return;
    }

    // velocidad de reproduccion aleatoria entre 0.6 y 1.6
    const ratio = Math.random() * (1.6 - 0.6) + 0.6; 

    audioPlayer.shouldCorrectPitch = false;
    audioPlayer.setPlaybackRate(ratio);

    audioPlayer.seekTo(0);
    audioPlayer.play();
  }


  const requestPermissionAndStartListening = async () => {
    if (motionData) {
      console.log("Ya está escuchando el acelerómetro");
      return; // Regresar si ya está escuchando
    }

    // Obtener permisos
    const { status } = await Accelerometer.getPermissionsAsync();
    console.log('Permission status:', status);

    // Solicitar permisos si no están concedidos
    if (status !== 'granted') {
      const { status: newStatus } = await Accelerometer.requestPermissionsAsync();
      console.log('New permission status:', newStatus);
    }

    // Verificar disponibilidad del sensor);
    const available = await Accelerometer.isAvailableAsync();
    console.log('Accelerometer available:', available);
    
    // Iniciar escucha de datos del sensor
    /*
      Acélerómetro: detecta movimientos en los ejes.
      Al detectar un movimiento, baja la vida de la galleta.
      La vida baja más si el movimiento es más fuerte.
    */
    if (available) {
      Accelerometer.addListener((data) => {
        //console.log(data);
        const x = data.x;
        const y = data.y - 1; // Ajustar para gravedad
        const z = data.z;

        let damage = 0;

        // ignorar cuando el celular está en reposo y hacia abajo
        if ((y >= 1.0 || y <= -1.0) && (x >= -0.3 && x <= 0.3)) {
          //console.log("Celular en reposo, ignorando.");
          return;
        }
        
        //Lógica para detectar sacudidas
        if (y >= 1.8 || y <= -1.8 || x >= 1.8 || x <= -1.8) {
          //console.log("se agitó fuerte el celular con: x=" + x + " y=" + y);
          setBoxColor('red');
          reproducirSonido();
          damage = 3;
        }
        else if (y >= 1.3 || y <= -1.3 || x >= 1.3 || x <= -1.3) {
          //console.log("se agitó el celular con: x=" + x + " y=" + y);
          setBoxColor('orange');
          reproducirSonido();
          damage = 1;
        }
        else {
          setBoxColor('skyblue');
        }

        setHp((prevHP) => prevHP - damage);

        setMotionData(data);
      });
    }
  };

  if (hp <= 0) {
    return (
      <View style={[styles.container, {backgroundColor: 'black'}]}>
        <Text style={{color: 'white', fontSize: 30, fontWeight: 'bold', textAlign: 'center'}}>
          ¡La galleta de la fortuna se ha roto! {"\n"}
        </Text>
        <Button 
          title="Reiniciar Galleta"
          onPress={() => {
            setHp(30);
            setBoxColor('skyblue');
          }}
        />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: boxColor}]}>
      <Text>{hp} {"\n"}Prueba: Cuadrado que cambia de color al agitarse</Text>
      <View style={[styles.caja, { backgroundColor: boxColor }]}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}> vida: {hp} </Text>
      </View>
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

  caja: {
    width: 200,
    height: 200,
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
  }
});

