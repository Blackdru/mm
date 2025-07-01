import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { gameStyles } from '../styles/gameStyles';

const EMOTES = ['😀', '😂', '😍', '😎', '🤔', '😢', '😡', '👍', '👎', '❤️'];

export default function EmotePanel({ onSendEmote, disabled = false }) {
  return (
    <View style={gameStyles.emoteContainer}>
      {EMOTES.map((emote) => (
        <TouchableOpacity
          key={emote}
          style={gameStyles.emoteButton}
          onPress={() => onSendEmote(emote)}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={gameStyles.emoteText}>{emote}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}