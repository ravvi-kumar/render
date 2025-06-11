import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import * as XLSX from 'xlsx';

interface ExcelUploaderProps {
  onDataImport: (data: any[]) => void;
  onUploadStart: () => void;
  onUploadComplete: () => void;
  isUploading: boolean;
}

const ExcelUploader: React.FC<ExcelUploaderProps> = ({ 
  onDataImport, 
  onUploadStart, 
  onUploadComplete, 
  isUploading 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    onUploadStart();
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);


        const processedData: any[] = jsonData.map((row: any) => {
          
          return {
            image: row.IMAGE || row.image || '',
            name: row.NAME || row.name || row.Name || '',
            sku: row.SKU || row.sku || row['SKU (?)'] || '',
            upc: row.UPC || row.upc || '',
            comments: row.COMMENTS || row.comments || row.Comments || '',
            inbound: parseInt(row.Inbound || row.inbound || row.INBOUND || '0') || 0,
            tag: row.Tag || row.tag || row.TAG || '',
            weight: parseFloat(row['weight (LBS.)'] || row.weight || row.Weight || '0') || 0,
            cubicQty: parseFloat(row['Cubic QTY / per unit'] || row.cubicQty || row['Cubic QTY'] || '0') || 0,
            stock: parseInt(row.Stock || row.stock || row.STOCK || '0') || 0
          };
        });

        onDataImport(processedData);
        setSuccess(`Successfully imported ${processedData.length} records`);
      } catch (err) {
        setError('Error processing Excel file. Please check the format and try again.');
      } finally {
        onUploadComplete();
      }
    };

    reader.onerror = () => {
      setError('Error reading file');
      onUploadComplete();
    };

    reader.readAsArrayBuffer(file);
  }, [onDataImport, onUploadStart, onUploadComplete]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel' ||
          file.name.endsWith('.xlsx') || 
          file.name.endsWith('.xls')) {
        processFile(file);
      } else {
        setError('Please upload a valid Excel file (.xlsx or .xls)');
      }
    }
  }, [processFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  }, [processFile]);

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-300 hover:border-slate-400'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            {isUploading ? (
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {isUploading ? 'Processing...' : 'Upload Excel File'}
            </h3>
            <p className="text-slate-600 mb-4">
              Drag and drop your Excel file here, or click to browse
            </p>
            <Button variant="outline" disabled={isUploading}>
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
          </div>
          
          <div className="text-xs text-slate-500">
            Supported formats: .xlsx, .xls
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ExcelUploader;