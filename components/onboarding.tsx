'use client'
import { useForm } from "react-hook-form";
import { FormProvider } from "react-hook-form";
import { Step } from "./ui/stepper";
import { FormStepper } from "./ui/stepper";
import { FormInput } from "./ui/stepper";

export default function Onboarding() {
  const methods = useForm({
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      zipCode: ''
    }
  });

  const { trigger, getValues, formState: { errors } } = methods;

  const stepFields: Record<number, string[]> = {
    1: ['firstName', 'lastName'],
    2: ['email', 'phone'],
    3: ['address', 'city', 'zipCode']
  };

  const validateCurrentStep = async (step: number) => {
    const fields = stepFields[step];
    const result = await trigger(fields as any);
    return result;
  };

  const handleFormComplete = (data: any) => {
    const formData = getValues();
    console.log('Form submitted:', formData);
    alert(`Form submitted successfully!\n\n${JSON.stringify(formData, null, 2)}`);
  };

  return (
    <div className="min-h-screen">
      <FormProvider {...methods}>
        <FormStepper
          validateStep={validateCurrentStep}
          onFinalStepCompleted={handleFormComplete}
        >
          <Step>
            <h2 className="text-2xl font-bold text-white mb-4">Personal Information</h2>
            <p className="text-neutral-400 mb-6">Let's start with your basic details</p>
            <FormInput
              label="First Name"
              name="firstName"
              placeholder="John"
              error={errors.firstName?.message}
              validation={{
                required: 'First name is required',
                minLength: { value: 2, message: 'First name must be at least 2 characters' }
              }}
            />
            <FormInput
              label="Last Name"
              name="lastName"
              placeholder="Doe"
              error={errors.lastName?.message}
              validation={{
                required: 'Last name is required',
                minLength: { value: 2, message: 'Last name must be at least 2 characters' }
              }}
            />
          </Step>

          <Step>
            <h2 className="text-2xl font-bold text-white mb-4">Contact Details</h2>
            <p className="text-neutral-400 mb-6">How can we reach you?</p>
            <FormInput
              label="Email"
              name="email"
              type="email"
              placeholder="john@example.com"
              error={errors.email?.message}
              validation={{
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              }}
            />
            <FormInput
              label="Phone"
              name="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              error={errors.phone?.message}
              validation={{
                required: 'Phone number is required',
                pattern: {
                  value: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
                  message: 'Invalid phone number'
                }
              }}
            />
          </Step>

          <Step>
            <h2 className="text-2xl font-bold text-white mb-4">Address</h2>
            <p className="text-neutral-400 mb-6">Where should we send your information?</p>
            <FormInput
              label="Street Address"
              name="address"
              placeholder="123 Main St"
              error={errors.address?.message}
              validation={{
                required: 'Street address is required',
                minLength: { value: 5, message: 'Address must be at least 5 characters' }
              }}
            />
            <FormInput
              label="City"
              name="city"
              placeholder="New York"
              error={errors.city?.message}
              validation={{
                required: 'City is required',
                minLength: { value: 2, message: 'City must be at least 2 characters' }
              }}
            />
            <FormInput
              label="ZIP Code"
              name="zipCode"
              placeholder="10001"
              error={errors.zipCode?.message}
              validation={{
                required: 'ZIP code is required',
                pattern: {
                  value: /^\d{5}(-\d{4})?$/,
                  message: 'Invalid ZIP code (use format: 12345 or 12345-6789)'
                }
              }}
            />
          </Step>
        </FormStepper>
      </FormProvider>
    </div>
  );
}