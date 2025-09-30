// Excel processing utility for importing books
class ExcelProcessor {
  constructor() {
    this.supportedExtensions = ['xlsx', 'xls', 'csv'];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
  }

  // Validate file before processing
  validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push('No se ha seleccionado ningún archivo');
      return { valid: false, errors };
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`El archivo es demasiado grande. Máximo permitido: ${this.formatFileSize(this.maxFileSize)}`);
    }

    // Check file extension
    const extension = this.getFileExtension(file.name);
    if (!this.supportedExtensions.includes(extension)) {
      errors.push(`Formato de archivo no soportado. Formatos permitidos: ${this.supportedExtensions.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Get file extension
  getFileExtension(filename) {
    return filename.toLowerCase().split('.').pop();
  }

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Process Excel/CSV file
  async processFile(file) {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        data: []
      };
    }

    try {
      const extension = this.getFileExtension(file.name);
      let data;

      if (extension === 'csv') {
        data = await this.processCSV(file);
      } else {
        data = await this.processExcel(file);
      }

      return {
        success: true,
        data: data.books,
        headers: data.headers,
        rowCount: data.books.length,
        errors: data.errors || []
      };
    } catch (error) {
      console.error('Error processing file:', error);
      return {
        success: false,
        errors: [error.message],
        data: []
      };
    }
  }

  // Process CSV file
  async processCSV(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csv = e.target.result;
          const lines = csv.split('\n').filter(line => line.trim());
          
          if (lines.length === 0) {
            throw new Error('El archivo CSV está vacío');
          }

          // Parse headers
          const headers = this.parseCSVLine(lines[0]);
          const normalizedHeaders = this.normalizeHeaders(headers);
          
          // Parse data rows
          const books = [];
          const errors = [];

          for (let i = 1; i < lines.length; i++) {
            try {
              const values = this.parseCSVLine(lines[i]);
              if (values.length > 0 && values.some(val => val.trim())) {
                const book = this.mapRowToBook(normalizedHeaders, values, i + 1);
                books.push(book);
              }
            } catch (error) {
              errors.push(`Fila ${i + 1}: ${error.message}`);
            }
          }

          resolve({ books, headers: normalizedHeaders, errors });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Error leyendo el archivo CSV'));
      reader.readAsText(file, 'UTF-8');
    });
  }

  // Process Excel file (requires external library in real implementation)
  async processExcel(file) {
    // For now, we'll return a mock implementation
    // In a real app, you'd use a library like 'xlsx' or 'exceljs'
    throw new Error('Procesamiento de Excel no implementado aún. Por favor, use formato CSV.');
  }

  // Parse CSV line handling quoted values
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  }

  // Normalize headers to standard field names
  normalizeHeaders(headers) {
    const headerMap = {
      // Spanish headers
      'título': 'title',
      'titulo': 'title',
      'nombre': 'title',
      'libro': 'title',
      'autor': 'authors',
      'autores': 'authors',
      'escritor': 'authors',
      'descripción': 'description',
      'descripcion': 'description',
      'resumen': 'description',
      'sinopsis': 'description',
      'categoría': 'category',
      'categoria': 'category',
      'género': 'category',
      'genero': 'category',
      'tipo': 'category',
      'editorial': 'publisher',
      'editor': 'publisher',
      'publicado': 'publishedDate',
      'fecha': 'publishedDate',
      'año': 'publishedDate',
      'páginas': 'pageCount',
      'paginas': 'pageCount',
      'hojas': 'pageCount',
      'isbn': 'isbn',
      'idioma': 'language',
      'lenguaje': 'language',
      'valoración': 'rating',
      'valoracion': 'rating',
      'puntuación': 'rating',
      'puntuacion': 'rating',
      'calificación': 'rating',
      'calificacion': 'rating',
      'nota': 'rating',
      'notas': 'notes',
      'comentarios': 'notes',
      'observaciones': 'notes',
      'reseña': 'review',
      'resena': 'review',
      'opinión': 'review',
      'opinion': 'review',
      'progreso': 'progress',
      'avance': 'progress',
      'porcentaje': 'progress',
      'etiquetas': 'tags',
      'tags': 'tags',
      'marcadores': 'tags',
      
      // English headers
      'title': 'title',
      'name': 'title',
      'book': 'title',
      'author': 'authors',
      'authors': 'authors',
      'writer': 'authors',
      'description': 'description',
      'summary': 'description',
      'synopsis': 'description',
      'category': 'category',
      'genre': 'category',
      'type': 'category',
      'publisher': 'publisher',
      'published': 'publishedDate',
      'date': 'publishedDate',
      'year': 'publishedDate',
      'pages': 'pageCount',
      'language': 'language',
      'rating': 'rating',
      'score': 'rating',
      'notes': 'notes',
      'comments': 'notes',
      'review': 'review',
      'opinion': 'review',
      'progress': 'progress',
      'percentage': 'progress',
      'tags': 'tags',
      'labels': 'tags'
    };

    return headers.map(header => {
      const normalized = header.toLowerCase().trim();
      return headerMap[normalized] || header;
    });
  }

  // Map row values to book object
  mapRowToBook(headers, values, rowNumber) {
    const book = {};
    
    for (let i = 0; i < headers.length && i < values.length; i++) {
      const header = headers[i];
      const value = values[i]?.toString().trim();
      
      if (value) {
        switch (header) {
          case 'title':
            book.title = value;
            break;
          case 'authors':
            book.authors = value;
            break;
          case 'description':
            book.description = value;
            break;
          case 'category':
            book.category = value;
            break;
          case 'publisher':
            book.publisher = value;
            break;
          case 'publishedDate':
            book.publishedDate = value;
            break;
          case 'pageCount':
            const pages = parseInt(value);
            if (!isNaN(pages)) {
              book.pageCount = pages;
            }
            break;
          case 'language':
            book.language = value;
            break;
          case 'isbn':
            book.isbn = value;
            break;
          case 'rating':
            const rating = parseFloat(value);
            if (!isNaN(rating) && rating >= 0 && rating <= 5) {
              book.personalRating = rating;
            }
            break;
          case 'notes':
            book.notes = value;
            break;
          case 'review':
            book.review = value;
            break;
          case 'progress':
            const progress = parseInt(value);
            if (!isNaN(progress) && progress >= 0 && progress <= 100) {
              book.progress = progress;
            }
            break;
          case 'tags':
            book.tags = value;
            break;
          default:
            // Store custom fields
            book[header] = value;
        }
      }
    }

    // Validate required fields
    if (!book.title) {
      throw new Error('El título es obligatorio');
    }

    return book;
  }

  // Generate template CSV for users
  generateTemplateCSV() {
    const headers = [
      'Título',
      'Autor',
      'Descripción',
      'Categoría',
      'Editorial',
      'Año Publicación',
      'Páginas',
      'ISBN',
      'Idioma',
      'Valoración Personal',
      'Notas',
      'Reseña',
      'Progreso (%)',
      'Etiquetas'
    ];

    const sampleData = [
      [
        'El Quijote',
        'Miguel de Cervantes',
        'Las aventuras de Don Quijote de la Mancha',
        'Clásicos',
        'Real Academia Española',
        '1605',
        '1000',
        '978-84-376-0494-7',
        'es',
        '5',
        'Una obra maestra de la literatura',
        'Excelente novela que marca el inicio de la literatura moderna',
        '100',
        'clásicos, español, aventura'
      ]
    ];

    let csv = headers.join(',') + '\n';
    sampleData.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    return csv;
  }

  // Download template CSV
  downloadTemplate() {
    const csv = this.generateTemplateCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla_libros.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}

// Create singleton instance
const excelProcessor = new ExcelProcessor();

export default excelProcessor;