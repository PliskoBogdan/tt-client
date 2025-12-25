import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { useDeviceId } from "../hooks/useDeviceId";
import { api } from "./src/api/api";
import { useSnackbar } from './src/providers/SnackbarProvider';


export default function App() {
  const snackbar = useSnackbar();
  const deviceId = useDeviceId();

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTodos();
    }, [])
  );

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/todos?deviceId=${deviceId}`);

      setTimeout(() => {
        setTodos(data.items);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching todos:', error);
      setLoading(false);
    }
  };

  const deleteTodo = (id) => {
    Alert.alert(
      'Видалити замітку',
      'Ви впевнені, що хочете видалити цю замітку?',
      [
        { text: 'Скасування', style: 'cancel' },
        { 
          text: 'Видалити', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/todos/${id}`);
              setTodos(todos.filter(({ _id }) => _id !== id));
              setModalVisible(false);
              snackbar.success('Замітку було успішно видалено');
            } catch (error) {
              console.error(`Error when delete todo id-${id}`, error);
            }
          }
        }
      ]
    );
  };

  const createPhotoTodo = () => {
    Alert.alert(
      'Создание из фото', 
      'Для реализации используйте:\n• expo-image-picker для выбора фото\n• OCR API (Google Vision, AWS Textract) для распознавания текста'
    );
  };

  const openTodoDetail = (todo) => {
    setSelectedTodo(todo);
    setModalVisible(true);
  };

  const renderTodoItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.todoItem}
      onPress={() => openTodoDetail(item)}
      activeOpacity={0.7}
    >      
      <View style={styles.todoContent}>
        <Text style={styles.todoDescription} numberOfLines={1}>
          {item.text}
        </Text>
      </View>

      <View style={styles.todoMeta}>
        <View style={[styles.typeBadge, styles[`${item.source}Badge`]]}>
          <Feather 
            name={item.source === 'voice' ? 'mic' : item.source === 'photo' ? 'image' : 'edit-3'} 
            size={12} 
            color="#fff" 
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={styles.loadingText}>Завантаження заміток...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Мої замітки</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {todos.filter(t => !t.completed).length} активних
          </Text>
        </View>
      </View>

      <FlatList
        data={todos}
        renderItem={renderTodoItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="check-circle" size={64} color="#DDD" />
            <Text style={styles.emptyText}>Немає заміток</Text>
            <Text style={styles.emptySubtext}>Створіть першу замітку</Text>
          </View>
        }
      />

      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={[styles.fab, styles.fabSecondary]}
          onPress={createPhotoTodo}
          activeOpacity={0.8}
        >
          <Feather name="camera" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.fab, styles.fabPrimary]}
          onPress={() => router.push("/voice")}
          activeOpacity={0.8}
        >
          <Feather name="mic" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Modal для просмотра деталей */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Деталі замітки</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedTodo && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Опис</Text>
                  <Text style={styles.modalText}>{selectedTodo.text}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Тип замітки</Text>
                  <View style={styles.typeRow}>
                    <Feather 
                      name={selectedTodo.source === 'voice' ? 'mic' : selectedTodo.source === 'photo' ? 'image' : 'edit-3'} 
                      size={16} 
                      color="#666" 
                    />
                    <Text style={styles.typeText}>
                      {selectedTodo.source === 'voice' ? 'Голосом' : selectedTodo.source === 'photo' ? 'Из фото' : 'Текст'}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.deleteButton]}
                    onPress={() => deleteTodo(selectedTodo._id)}
                  >
                    <Feather name="trash-2" size={20} color="#FF6B6B" />
                    <Text style={[styles.buttonText, styles.deleteButtonText]}>
                      Видилити
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
  },
  statsText: {
    fontSize: 14,
    color: '#6C757D',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  todoItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginRight: 12,
  },
  checkboxCompleted: {
    backgroundColor: '#6C5CE7',
  },
  todoContent: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#ADB5BD',
  },
  todoDescription: {
    fontSize: 14,
    color: '#6C757D',
  },
  todoMeta: {
    marginLeft: 8,
  },
  typeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceBadge: {
    backgroundColor: '#6C5CE7',
  },
  photoBadge: {
    backgroundColor: '#51CF66',
  },
  textBadge: {
    backgroundColor: '#74C0FC',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabPrimary: {
    backgroundColor: '#6C5CE7',
  },
  fabSecondary: {
    backgroundColor: '#51CF66',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ADB5BD',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CED4DA',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C757D',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  modalText: {
    fontSize: 16,
    color: '#212529',
    lineHeight: 24,
  },
  statusRow: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFC107',
  },
  statusCompleted: {
    backgroundColor: '#51CF66',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeText: {
    fontSize: 16,
    color: '#495057',
  },
  modalActions: {
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  statusButton: {
    backgroundColor: '#F1EFFD',
  },
  deleteButton: {
    backgroundColor: '#FFE5E5',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C5CE7',
  },
  deleteButtonText: {
    color: '#FF6B6B',
  },
});