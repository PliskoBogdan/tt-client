import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
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

// Моковые данные для демонстрации
const mockTodos = [
  {
    "_id": "694c1b38d231224144d93d2a",
    "deviceId": "123",
    "text": "для распечатки образцов. Lorem Ipsum не только успешно пережил без заметных изменений пять веков, но и перешагнул в электронный дизайн. Его популяризации в новое время послужили публикация листов Letraset",
    "source": "voice",
    "completed": false,
    "createdAt": "2025-12-24T16:56:24.023Z",
    "updatedAt": "2025-12-24T16:56:24.023Z",
    "__v": 0
},
  {
    "_id": "353242",
    "deviceId": "123",
    "text": "Lorem Ipsum - это текст-рыба, часто используемый в печати и вэб-дизайне. Lorem Ipsum является стандартной рыбой для текстов на латинице с начала XVI века. В то время некий безымянный печатник создал большую коллекцию размеров и форм шрифтов, используя Lorem Ipsum",
    "source": "voice",
    "completed": false,
    "createdAt": "2025-12-24T16:56:24.023Z",
    "updatedAt": "2025-12-24T16:56:24.023Z",
    "__v": 0
},
  {
    "_id": "3532fd42",
    "deviceId": "123",
    "text": "Привет, это заметка номер 123 из содержимым текстовым",
    "source": "photo",
    "completed": false,
    "createdAt": "2025-12-24T16:56:24.023Z",
    "updatedAt": "2025-12-24T16:56:24.023Z",
    "__v": 0
}
];

const STORAGE_KEY = '@todos_storage';

export default function App() {
  const deviceId = useDeviceId();
  const params = useLocalSearchParams();

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Симуляция загрузки данных с API
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

      console.log('datals', data.items)

      // Здесь должен быть реальный API запрос
      // const response = await fetch('YOUR_API_ENDPOINT');
      // const data = await response.json();
      
      // Симуляция задержки API
      setTimeout(() => {
        setTodos(data.items);
        // setTodos(mockTodos);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching todos:', error);
      setLoading(false);
    }
  };

  const toggleTodoStatus = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id 
        ? { ...todo, status: todo.status === 'active' ? 'completed' : 'active' }
        : todo
    ));
  };

  const deleteTodo = (id) => {
    Alert.alert(
      'Удалить задачу',
      'Вы уверены, что хотите удалить эту задачу?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: () => {
            setTodos(todos.filter(todo => todo.id !== id));
            setModalVisible(false);
          }
        }
      ]
    );
  };

  const createVoiceTodo = () => {
    Alert.alert(
      'Голосовой ввод', 
      'Для реализации используйте:\n• expo-av для записи аудио\n• Speech-to-text API для распознавания'
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
        <Text style={styles.loadingText}>Загрузка задач...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Мои заметки1</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {todos.filter(t => !t.completed).length} активных
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
            <Text style={styles.emptyText}>Нет задач</Text>
            <Text style={styles.emptySubtext}>Создайте первую задачу</Text>
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
              <Text style={styles.modalTitle}>Детали заметки</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedTodo && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Описание</Text>
                  <Text style={styles.modalText}>{selectedTodo.text}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Тип создания</Text>
                  <View style={styles.typeRow}>
                    <Feather 
                      name={selectedTodo.type === 'voice' ? 'mic' : selectedTodo.type === 'photo' ? 'image' : 'edit-3'} 
                      size={16} 
                      color="#666" 
                    />
                    <Text style={styles.typeText}>
                      {selectedTodo.type === 'voice' ? 'Голосом' : selectedTodo.type === 'photo' ? 'Из фото' : 'Текст'}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.deleteButton]}
                    onPress={() => deleteTodo(selectedTodo.id)}
                  >
                    <Feather name="trash-2" size={20} color="#FF6B6B" />
                    <Text style={[styles.buttonText, styles.deleteButtonText]}>
                      Удалить
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