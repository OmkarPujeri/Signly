export const signs = [
  // Alphabet A-Z ONLY
  ...Array.from({ length: 26 }, (_, i) => {
    const letter = String.fromCharCode(65 + i);
    const lowerLetter = letter.toLowerCase();
    const handShapes = {
      A: "Closed fist, thumb to side",
      B: "Four fingers up, thumb folded",
      C: "Curved hand like letter C",
      D: "Index up, other fingers touch thumb",
      E: "All fingers bent, thumb tucked",
      F: "Index and thumb circle, others up",
      G: "Index points sideways, thumb out",
      H: "Two fingers point sideways",
      I: "Pinky up, others closed",
      J: "Pinky up, draw J motion",
      K: "Index and middle up in V, thumb between",
      L: "Index up, thumb out like L",
      M: "Three fingers over thumb",
      N: "Two fingers over thumb",
      O: "All fingers curve to touch thumb",
      P: "Like K but pointing down",
      Q: "Like G but pointing down",
      R: "Index and middle crossed",
      S: "Closed fist, thumb over fingers",
      T: "Thumb between index and middle",
      U: "Index and middle up together",
      V: "Index and middle up spread apart",
      W: "Three fingers up spread apart",
      X: "Index finger hooked",
      Y: "Thumb and pinky out",
      Z: "Index draws letter Z in air"
    };
    const tips = {
      A: "Keep your thumb resting on the side of your fist, not tucked under",
      B: "Keep all four fingers pressed tightly together and perfectly straight",
      C: "Curve all fingers together — imagine holding a tennis ball",
      D: "Touch your middle, ring and pinky fingertips to your thumb to form the circle",
      E: "Bend all fingers down at the knuckle, thumb tucked under",
      F: "Only your index finger and thumb touch — other three fingers stay up",
      G: "Point index finger sideways, thumb parallel — like a horizontal gun shape",
      H: "Index and middle finger point sideways together, kept flat",
      I: "Only the pinky extends — keep all other fingers tightly closed",
      J: "Start like I (pinky up) then trace a J curve in the air",
      K: "Index up, middle finger angled out, thumb between them",
      L: "Index finger straight up, thumb out to the side — classic L shape",
      M: "Tuck your thumb under three fingers: middle, ring and pinky overlap it",
      N: "Tuck your thumb under two fingers: index and middle overlap it",
      O: "All fingertips meet the thumb — make a tighter circle than C",
      P: "Like K but rotate your whole hand so fingers point downward",
      Q: "Like G but rotate your whole hand so fingers point downward",
      R: "Cross your index finger over your middle finger tightly",
      S: "Close all fingers into a fist with thumb across the front",
      T: "Tuck your thumb between your index and middle finger",
      U: "Index and middle finger up together, touching side by side",
      V: "Index and middle finger up and spread apart — peace sign",
      W: "Index, middle and ring fingers all up and spread apart",
      X: "Bend only your index finger into a hook shape",
      Y: "Extend only thumb and pinky outward, keep other three fingers closed",
      Z: "Use your index finger to draw the letter Z shape in the air"
    };
    return {
      id: i + 1,
      word: letter,
      category: "alphabet",
      src: `/assets/signs/${lowerLetter}.gif`,
      handShape: handShapes[letter] || "Standard position",
      description: `Hold the hand in the position for the letter ${letter}.`,
      tip: tips[letter] || "Keep your wrist straight and hand steady."
    };
  })
];
