import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CategoriesContext = createContext();

export const useCategories = () => {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
};

// Default categories that all users have
const DEFAULT_CATEGORIES = [
  { id: 'to-read', name: 'Por Leer', icon: '📚', isDefault: true, color: '#3B82F6' },
  { id: 'reading', name: 'Leyendo', icon: '📖', isDefault: true, color: '#10B981' },
  { id: 'read', name: 'Leídos', icon: '✅', isDefault: true, color: '#8B5CF6' },
  { id: 'favorites', name: 'Favoritos', icon: '❤️', isDefault: true, color: '#EF4444' },
  { id: 'wishlist', name: 'Lista de Deseos', icon: '⭐', isDefault: true, color: '#F59E0B' }
];

export const CategoriesProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);

  // Load user categories when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserCategories();
    } else {
      setCategories(DEFAULT_CATEGORIES);
    }
  }, [isAuthenticated, user]);

  const loadUserCategories = async () => {
    try {
      setLoading(true);
      
      // Mock API call - Replace with real API when Laravel backend is ready
      const savedCategories = localStorage.getItem(`categories_${user.id}`);
      if (savedCategories) {
        const userCategories = JSON.parse(savedCategories);
        // Merge default categories with user custom categories
        const mergedCategories = [
          ...DEFAULT_CATEGORIES,
          ...userCategories.filter(cat => !cat.isDefault)
        ];
        setCategories(mergedCategories);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  const saveCategoriesToStorage = (updatedCategories) => {
    if (user) {
      localStorage.setItem(`categories_${user.id}`, JSON.stringify(updatedCategories));
    }
  };

  const createCategory = async (categoryData) => {
    try {
      const newCategory = {
        id: `custom_${Date.now()}`,
        name: categoryData.name,
        icon: categoryData.icon || '📁',
        color: categoryData.color || '#6B7280',
        isDefault: false,
        createdAt: new Date().toISOString()
      };

      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      saveCategoriesToStorage(updatedCategories);

      return { success: true, category: newCategory };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateCategory = async (categoryId, updates) => {
    try {
      // Don't allow updating default categories core properties
      const category = categories.find(c => c.id === categoryId);
      if (category?.isDefault && (updates.name || updates.id)) {
        throw new Error('No se pueden modificar las categorías predeterminadas');
      }

      const updatedCategories = categories.map(category =>
        category.id === categoryId
          ? { ...category, ...updates, updatedAt: new Date().toISOString() }
          : category
      );

      setCategories(updatedCategories);
      saveCategoriesToStorage(updatedCategories);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const deleteCategory = async (categoryId) => {
    try {
      const category = categories.find(c => c.id === categoryId);
      if (category?.isDefault) {
        throw new Error('No se pueden eliminar las categorías predeterminadas');
      }

      const updatedCategories = categories.filter(category => category.id !== categoryId);
      setCategories(updatedCategories);
      saveCategoriesToStorage(updatedCategories);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const getCategoryById = (categoryId) => {
    return categories.find(category => category.id === categoryId);
  };

  const getCustomCategories = () => {
    return categories.filter(category => !category.isDefault);
  };

  const getDefaultCategories = () => {
    return categories.filter(category => category.isDefault);
  };

  // Import categories from Excel data
  const importCategoriesFromData = async (booksData) => {
    try {
      const existingCategoryNames = categories.map(c => c.name.toLowerCase());
      const newCategories = [];

      // Extract unique categories from books data
      const categoryNames = [...new Set(
        booksData
          .map(book => book.category)
          .filter(cat => cat && !existingCategoryNames.includes(cat.toLowerCase()))
      )];

      // Create new categories
      categoryNames.forEach(name => {
        const newCategory = {
          id: `imported_${Date.now()}_${Math.random()}`,
          name: name,
          icon: '📁',
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          isDefault: false,
          imported: true,
          createdAt: new Date().toISOString()
        };
        newCategories.push(newCategory);
      });

      if (newCategories.length > 0) {
        const updatedCategories = [...categories, ...newCategories];
        setCategories(updatedCategories);
        saveCategoriesToStorage(updatedCategories);
      }

      return { success: true, imported: newCategories.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCustomCategories,
    getDefaultCategories,
    importCategoriesFromData,
    defaultCategories: DEFAULT_CATEGORIES
  };

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
};