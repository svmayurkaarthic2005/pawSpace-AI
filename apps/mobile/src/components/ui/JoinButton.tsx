import React, { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Feather';
import api from '../../services/api';

interface JoinButtonProps {
  communityId: string;
  isMember: boolean;
  onJoin?: (data: any) => void;
  onLeave?: (data: any) => void;
  compact?: boolean;
}

export const JoinButton: React.FC<JoinButtonProps> = ({
  communityId,
  isMember: initialIsMember,
  onJoin,
  onLeave,
  compact = false,
}) => {
  const [localMember, setLocalMember] = useState(initialIsMember);
  const queryClient = useQueryClient();

  const joinMutation = useMutation({
    mutationFn: () => api.post(`/communities/${communityId}/join`),
    onMutate: () => {
      setLocalMember(true);
    },
    onError: () => {
      setLocalMember(false);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['my-communities'] });
      queryClient.invalidateQueries({ queryKey: ['communities-discover'] });
      onJoin?.(response.data);
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.delete(`/communities/${communityId}/leave`),
    onMutate: () => {
      setLocalMember(false);
    },
    onError: () => {
      setLocalMember(true);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['my-communities'] });
      queryClient.invalidateQueries({ queryKey: ['communities-discover'] });
      onLeave?.(response.data);
    },
  });

  const handlePress = () => {
    if (localMember) {
      leaveMutation.mutate();
    } else {
      joinMutation.mutate();
    }
  };

  const isLoading = joinMutation.isPending || leaveMutation.isPending;

  return (
    <TouchableOpacity
      style={[
        compact ? styles.compactBtn : styles.fullBtn,
        localMember ? styles.joinedBtn : styles.joinBtn,
      ]}
      onPress={handlePress}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={localMember ? '#5DCAA5' : '#fff'} />
      ) : (
        <>
          {localMember && <Icon name="check" size={13} color="#5DCAA5" />}
          <Text style={[styles.btnText, localMember && styles.joinedText]}>
            {localMember ? 'Joined' : 'Join'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fullBtn: {
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'stretch',
  },
  compactBtn: {
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  joinBtn: {
    backgroundColor: '#7C3AED',
  },
  joinedBtn: {
    backgroundColor: 'rgba(29, 158, 117, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(29, 158, 117, 0.4)',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
  },
  joinedText: {
    color: '#5DCAA5',
  },
});
