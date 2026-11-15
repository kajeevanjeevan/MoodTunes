
import { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    StyleSheet,
    View,
} from "react-native";

type Props = {
  color?: string;
};

export default function AnimatedEqualizer({
  color = "#C6A8FF",
}: Props) {
  const bars = useRef(
    Array.from({ length: 4 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = bars.map((bar, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: 1,
            duration: 280 + index * 80,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bar, {
            toValue: 0,
            duration: 350 + index * 60,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      )
    );

    animations.forEach((animation) => animation.start());

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [bars]);

  return (
    <View style={styles.container}>
      {bars.map((bar, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              transform: [
                {
                  scaleY: bar.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 25,
    height: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  bar: {
    width: 4,
    height: 22,
    borderRadius: 3,
  },
});
