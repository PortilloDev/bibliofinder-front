import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { Upload, FileText, Download, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';
import { useBooks } from '../../context/BooksContext';
import { useCategories } from '../../context/CategoriesContext';
import excelProcessor from '../../utils/excelProcessor';
import { useToast } from '../../hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const ImportPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { importBooksFromData } = useBooks();
  const { importCategoriesFromData } = useCategories();
  
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults(null);
      setPreviewData(null);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setResults(null);
      setPreviewData(null);
    }
  };

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setProcessingStep('Validando archivo...');

    try {
      // Step 1: Process the file
      setProgress(25);
      const fileResult = await excelProcessor.processFile(file);
      
      if (!fileResult.success) {
        throw new Error(fileResult.errors.join(', '));
      }

      setProcessingStep('Analizando datos...');
      setProgress(50);
      
      // Show preview
      setPreviewData({
        headers: fileResult.headers,
        books: fileResult.data.slice(0, 5), // Preview first 5 books
        totalBooks: fileResult.data.length
      });

      setProcessingStep('Importando categorías...');
      setProgress(75);
      
      // Step 2: Import categories
      const categoriesResult = await importCategoriesFromData(fileResult.data);
      
      setProcessingStep('Importando libros...');
      setProgress(90);
      
      // Step 3: Import books
      const booksResult = await importBooksFromData(fileResult.data);
      
      setProgress(100);
      setProcessingStep('¡Importación completada!');

      // Set results
      setResults({
        success: true,
        totalProcessed: fileResult.data.length,
        booksImported: booksResult.imported || 0,
        categoriesImported: categoriesResult.imported || 0,
        errors: booksResult.errors || 0
      });

      toast({
        title: "¡Importación exitosa!",
        description: `Se han importado ${booksResult.imported} libros y ${categoriesResult.imported} categorías nuevas.`,
      });

    } catch (error) {
      console.error('Import error:', error);
      setResults({
        success: false,
        error: error.message
      });
      
      toast({
        title: "Error en la importación",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProcessingStep('');
    }
  };

  const downloadTemplate = () => {
    excelProcessor.downloadTemplate();
    toast({
      title: "Plantilla descargada",
      description: "Revisa tu carpeta de descargas para encontrar la plantilla CSV.",
    });
  };

  const resetImport = () => {
    setFile(null);
    setResults(null);
    setPreviewData(null);
    setProgress(0);
    setProcessingStep('');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Importar Libros desde Excel</h1>
        <p className="text-muted-foreground">
          Sube un archivo Excel o CSV para añadir múltiples libros a tu biblioteca de una vez
        </p>
      </div>

      {/* Instructions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Instrucciones</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">📋 Formato de archivo:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Archivos CSV (recomendado)</li>
                  <li>• Archivos Excel (.xlsx, .xls)</li>
                  <li>• Máximo 10MB de tamaño</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">📚 Columnas disponibles:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Título</strong> (obligatorio)</li>
                  <li>• Autor, Descripción, Categoría</li>
                  <li>• Editorial, Año, Páginas, ISBN</li>
                  <li>• Notas, Reseña, Valoración</li>
                </ul>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Las categorías personalizadas se crearán automáticamente si no existen.
                Puedes usar tanto nombres en español como en inglés para las columnas.
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Descargar Plantilla CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Subir Archivo</CardTitle>
          <CardDescription>
            Arrastra tu archivo aquí o haz clic para seleccionarlo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-4">
                <CheckCircle className="h-12 w-12 text-primary mx-auto" />
                <div>
                  <h3 className="font-medium">{file.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex justify-center space-x-2">
                  <Button onClick={processFile} disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Procesar Archivo
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetImport}>
                    Cambiar Archivo
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="space-y-2">
                  <h3 className="font-medium">Seleccionar archivo</h3>
                  <p className="text-sm text-muted-foreground">
                    Soporta CSV, Excel (.xlsx, .xls)
                  </p>
                  <div className="pt-4">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload">
                      <Button variant="outline" asChild>
                        <span className="cursor-pointer">Examinar archivos</span>
                      </Button>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Processing Progress */}
      {isProcessing && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Procesando archivo...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              {processingStep}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Preview Data */}
      {previewData && !results && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Vista Previa de Datos</CardTitle>
            <CardDescription>
              Primeros 5 libros de {previewData.totalBooks} encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  Total: {previewData.totalBooks} libros
                </Badge>
                <Badge variant="outline">
                  Columnas: {previewData.headers.length}
                </Badge>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {previewData.headers.slice(0, 4).map((header, index) => (
                        <th key={index} className="text-left p-2 font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.books.map((book, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{book.title}</td>
                        <td className="p-2">{book.authors}</td>
                        <td className="p-2">{book.category}</td>
                        <td className="p-2">{book.publishedDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {results.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span>
                {results.success ? 'Importación Completada' : 'Error en la Importación'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.success ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {results.booksImported}
                    </div>
                    <div className="text-sm text-muted-foreground">Libros importados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {results.categoriesImported}
                    </div>
                    <div className="text-sm text-muted-foreground">Categorías creadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {results.errors}
                    </div>
                    <div className="text-sm text-muted-foreground">Errores</div>
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <Button onClick={() => navigate('/library')}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Ver Mi Biblioteca
                  </Button>
                  <Button variant="outline" onClick={resetImport}>
                    Importar Otro Archivo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{results.error}</AlertDescription>
                </Alert>
                <Button variant="outline" onClick={resetImport}>
                  Intentar de Nuevo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImportPage;