
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  company_name: z.string().optional(),
  product_interest: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

function ContactFormComponent({ onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await pb.collection('contact_submissions').create(data, { $autoCancel: false });
      toast.success('Message sent successfully');
      reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="name" className="text-sm font-medium">
          Name *
        </Label>
        <Input
          id="name"
          type="text"
          {...register('name')}
          className="mt-1.5 text-foreground"
          placeholder="Your full name"
        />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email" className="text-sm font-medium">
          Email *
        </Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          className="mt-1.5 text-foreground"
          placeholder="your.email@company.com"
        />
        {errors.email && (
          <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone" className="text-sm font-medium">
          Phone *
        </Label>
        <Input
          id="phone"
          type="tel"
          {...register('phone')}
          className="mt-1.5 text-foreground"
          placeholder="+91 98765 43210"
        />
        {errors.phone && (
          <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="company_name" className="text-sm font-medium">
          Company name
        </Label>
        <Input
          id="company_name"
          type="text"
          {...register('company_name')}
          className="mt-1.5 text-foreground"
          placeholder="Your company"
        />
      </div>

      <div>
        <Label htmlFor="product_interest" className="text-sm font-medium">
          Product interest
        </Label>
        <Select onValueChange={(value) => setValue('product_interest', value)}>
          <SelectTrigger className="mt-1.5 text-foreground">
            <SelectValue placeholder="Select a product category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fasteners">Fasteners</SelectItem>
            <SelectItem value="bearings">Bearings</SelectItem>
            <SelectItem value="electrical">Electrical Items</SelectItem>
            <SelectItem value="engineering">Engineering Products</SelectItem>
            <SelectItem value="mro">MRO Supplies</SelectItem>
            <SelectItem value="custom">Custom Parts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="message" className="text-sm font-medium">
          Message *
        </Label>
        <Textarea
          id="message"
          {...register('message')}
          className="mt-1.5 min-h-[120px] text-foreground"
          placeholder="Tell us about your requirements..."
        />
        {errors.message && (
          <p className="text-sm text-destructive mt-1">{errors.message.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full transition-all duration-200 active:scale-[0.98]"
      >
        {isSubmitting ? 'Sending...' : 'Send message'}
      </Button>
    </form>
  );
}

export default ContactFormComponent;
