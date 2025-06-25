import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const amounts = [10, 20, 50, 100, 200, 500];

const SelectAmountScreen = ({ route, navigation }) => {
  const { gameType, playerCount } = route.params;

  const handleSelectAmount = (amount) => {
    navigation.navigate('MatchmakingScreen', { gameType, playerCount, amount });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Entry Amount</Text>
      <View style={styles.amountsRow}>
        {amounts.map((amt) => (
          <TouchableOpacity
            key={amt}
            style={styles.amountBtn}
            onPress={() => handleSelectAmount(amt)}
          >
            <Text style={styles.amountText}>₹{amt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f6fa',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  amountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  amountBtn: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 8,
    margin: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  amountText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SelectAmountScreen;
