import { Accelerometer } from 'expo-sensors';
import { useState, useEffect, useRef } from 'react';
import { View, Image, Text, Button, StyleSheet, Animated, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAudioPlayer } from 'expo-audio';
import { getFraseAleatoria } from './Frase';

const cookieCrackSound = require('./assets/galleta1.mp3');

export default function App() {
  const [playing, setPlaying] = useState(false);

  //Configuraciones del acelerómetro
  Accelerometer.setUpdateInterval(200);
  const [motionData, setMotionData] = useState(null);

  // Configuraciones de la galleta de la fortuna
  let [hp, setHp] = useState(30);
  const [boxColor, setBoxColor] = useState('skyblue');
  const audioPlayer = useAudioPlayer(cookieCrackSound);

  // state to hold fetched phrase when cookie breaks
  const [frase, setFrase] = useState(null);
  const [loadingFrase, setLoadingFrase] = useState(false);

  // configuracion para las animaciones
  const [frame, setFrame] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [inNormalRange, setInNormalRange] = useState(true);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const isShakingRef = useRef(false);

  shakeAnim.addListener(({ value }) => {
    console.log("shakeAnim value:", value);
  });


  const frames = [
    require('./assets/cookie-1.png'),
    require('./assets/cookie-2.png'),
    require('./assets/cookie-3.png'),
    require('./assets/cookie-4.png'),
    require('./assets/cookie-5.png'),
    require('./assets/cookie-6.png'),
  ];

  const startShake = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 30,
          duration: 50,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -30,
          duration: 50,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopShake = () => {
    shakeAnim.stopAnimation();
    shakeAnim.setValue(0);
    isShakingRef.current = false;
  };

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
        const x = data.x;
        const y = data.y - 1; // Ajustar para gravedad
        const z = data.z;

        let damage = 0;

        const isStrongShake =
          y >= 1.8 || y <= -1.8 || x >= 1.8 || x <= -1.8;

        const isMediumShake =
          y >= 1.3 || y <= -1.3 || x >= 1.3 || x <= -1.3;

        const isShakingNow = isStrongShake || isMediumShake;
        

        // si se agita
        if (isShakingNow) {
          if (!isShakingRef.current) {
            isShakingRef.current = true;
            setIsShaking(true);
            setInNormalRange(false);
            startShake(); // animación confiable
          }

          // cambio color
          if (isStrongShake) {
            setBoxColor('red');
            reproducirSonido();
            damage = 3;
          } 

          else if (isMediumShake) {
            setBoxColor('orange');
            reproducirSonido();
            damage = 1;
          }

          // actualizar HP y frame
          setHp((prevHP) => {
            const newHP = prevHP - damage;

            // actualizar frame cada 6 puntos de HP
            const frameIndex = Math.floor((30 - newHP) / 6);
            setFrame(frameIndex < frames.length ? frameIndex : frames.length - 1);

            return newHP;
          });

          setMotionData(data);
          return;
        }

        if (!isShakingNow && isShakingRef.current) {
          isShakingRef.current = false;
          setIsShaking(false);
          stopShake(); // detiene la animación
        }

        // volver color normal
        setBoxColor('skyblue');

        setMotionData(data);
      });
    }
  };

  // fetch a phrase when HP drops to 0 (or below)
  useEffect(() => {
    let mounted = true;
    if (hp <= 0) {
      setLoadingFrase(true);
      (async () => {
        const f = await getFraseAleatoria();
        if (mounted) {
          setFrase(f);
          setLoadingFrase(false);
        }
      })();
    } else {
      // reset phrase when cookie is alive again
      setFrase(null);
      setLoadingFrase(false);
    }
    return () => { mounted = false; };
  }, [hp]);

  if (hp <= 0) {
    return (
      <View style={[styles.container, {backgroundColor: 'black'}]}>
        <Text style={{color: 'white', fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginBottom: 12}}>
          ¡La galleta de la fortuna se ha roto!
        </Text>
        <Animated.View
          style={{
            transform: [{ translateX: shakeAnim }],
          }}
        >
          <Image
            source={frames[frame]}
            style={{ width: 200, height: 200 }}
          />
        </Animated.View>
        {loadingFrase && <Text style={{color: 'white'}}>Cargando frase...</Text>}
        {frase && (
          <>
            <Text style={{color: 'white', fontSize: 18, textAlign: 'center', marginTop: 10}}>
              "{frase.frase}"
            </Text>
            <Text style={{color: 'white', fontSize: 14, textAlign: 'center', marginTop: 6}}>
              — {frase.autor}
            </Text>
          </>
        )}
        <Button 
          title="Reiniciar Galleta"
          onPress={() => {
            setHp(30);
            setBoxColor('skyblue');
            setFrame(0);
          }}
        />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: boxColor}]}>
      <Animated.View
        style={{
          transform: [{ translateX: shakeAnim }],
        }}
      >
        <Image
          source={frames[frame]}
          style={{ width: 200, height: 200 }}
        />
      </Animated.View>

      <Text>{hp} {"\n"}Prueba: Cuadrado que cambia de color al agitarse {frame}</Text>
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
