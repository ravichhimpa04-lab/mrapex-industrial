
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
  company_name: z.string().min(2, 'Company name is required'),
  product_interest: z.string().optional(),
  message: z.string().optional(),
});

function ProductEnquiryModal({ open, onOpenChange }) {
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
      await pb.collection('product_enquiries').create(data, { $autoCancel: false });
      toast.success('Product enquiry submitted successfully');
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting product enquiry:', error);
      toast.error('Failed to submit enquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Product enquiry</DialogTitle>
          <DialogDescription>
            Have questions about our products? Fill out the form and our team will respond with detailed information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="enquiry-name" className="text-sm font-medium">
              Name *
            </Label>
            <Input
              id="enquiry-name"
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
            <Label htmlFor="enquiry-email" className="text-sm font-medium">
              Email *
            </Label>
            <Input
              id="enquiry-email"
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
            <Label htmlFor="enquiry-phone" className="text-sm font-medium">
              Phone *
            </Label>
            <Input
              id="enquiry-phone"
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
            <Label htmlFor="enquiry-company" className="text-sm font-medium">
              Company name *
            </Label>
            <Input
              id="enquiry-company"
              type="text"
              {...register('company_name')}
              className="mt-1.5 text-foreground"
              placeholder="Your company"
            />
            {errors.company_name && (
              <p className="text-sm text-destructive mt-1">{errors.company_name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="enquiry-company-address" className="text-sm font-medium">
              Company address *
            </Label>
            <Input
              id="enquiry-company-address"
              type="text"
              {...register('company_address')}
              className="mt-1.5 text-foreground"
              placeholder="Your company address"
            />
            {errors.company_address && (
              <p className="text-sm text-destructive mt-1">{errors.company_address.message}</p>
            )}
          </div>
          

          <div>
            <Label htmlFor="enquiry-product" className="text-sm font-medium">
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
            <Label htmlFor="enquiry-message" className="text-sm font-medium">
              Your question
            </Label>
            <Textarea
              id="enquiry-message"
              {...register('message')}
              className="mt-1.5 min-h-[100px] text-foreground"
              placeholder="What would you like to know about our products?"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full transition-all duration-200 active:scale-[0.98]"
          >
            {isSubmitting ? 'Submitting...' : 'Submit enquiry'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ProductEnquiryModal;
