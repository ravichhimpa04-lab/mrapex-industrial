
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const API_URL = 'https://script.google.com/macros/s/AKfycbxe0bxrj8lMIkRhUJC2AEB_brBmNPVTYctVM1AJmMY1r7Us2lchynQFDkAcLFeOG7ji/exec';

const formSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  company_name: z.string().min(2, 'Company name is required'),
  mobile_number: z.string().min(10, 'Valid mobile number is required'),
  email: z.string().email('Valid email is required'),
  product_required: z.string().min(2, 'Product requirement is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  message: z.string().optional(),
});

export default function RFQForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      company_name: '',
      mobile_number: '',
      email: '',
      product_required: '',
      quantity: 1,
      message: '',
    },
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Please upload file below 5MB.',
      });
      e.target.value = '';
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const fileToBase64 = (selectedFile) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result;
        const base64 = String(result).split(',')[1] || '';
        resolve(base64);
      };

      reader.onerror = reject;
      reader.readAsDataURL(selectedFile);
    });
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      let fileData = '';
      let fileName = '';
      let fileType = '';

      if (file) {
        fileName = file.name;
        fileType = file.type || 'application/octet-stream';
        fileData = await fileToBase64(file);
      }

      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          name: data.name,
          mobile: data.mobile_number,
          email: data.email,
          company: data.company_name,
          company_address: '',
          productName: data.product_required,
          partNo: '',
          category: 'RFQ',
          make: '',
          quantity: data.quantity,
          message: data.message || '',
          fileName,
          fileType,
          fileData,
        }),
      });

      toast.success('RFQ Submitted Successfully', {
        description: 'Our team will get back to you shortly with a quotation.',
      });

      reset();
      setFile(null);

      const fileInput = document.getElementById('file_upload');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('RFQ Submission Error:', error);
      toast.error('Submission Failed', {
        description: 'There was an error submitting your request. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card p-6 md:p-8 rounded-2xl shadow-lg border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input id="name" {...register('name')} placeholder="John Doe" className="text-foreground" />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_name">Company Name *</Label>
          <Input id="company_name" {...register('company_name')} placeholder="Acme Corp" className="text-foreground" />
          {errors.company_name && <p className="text-sm text-destructive">{errors.company_name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobile_number">Mobile Number *</Label>
          <Input id="mobile_number" {...register('mobile_number')} placeholder="+91 9876543210" className="text-foreground" />
          {errors.mobile_number && <p className="text-sm text-destructive">{errors.mobile_number.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input id="email" type="email" {...register('email')} placeholder="john@example.com" className="text-foreground" />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="product_required">Product Required *</Label>
          <Input id="product_required" {...register('product_required')} placeholder="e.g. M12 Hex Bolts" className="text-foreground" />
          {errors.product_required && <p className="text-sm text-destructive">{errors.product_required.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity *</Label>
          <Input id="quantity" type="number" {...register('quantity')} min="1" className="text-foreground" />
          {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file_upload">Upload Document/Drawing (Optional)</Label>
        <Input
          id="file_upload"
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
        />
        <p className="text-xs text-muted-foreground">Accepted formats: PDF, JPG, PNG, DOC. Max 5MB.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Additional Message (Optional)</Label>
        <Textarea
          id="message"
          {...register('message')}
          placeholder="Any specific requirements, material grades, or delivery timelines..."
          className="min-h-[100px] text-foreground"
        />
      </div>

      <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit RFQ'
        )}
      </Button>
    </form>
  );
}