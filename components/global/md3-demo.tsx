import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export function MD3Demo() {
  return (
    <div className="space-y-8 p-8">
      <h1 className="md-display-large">Material Design 3 Demo</h1>
      
      <section className="space-y-4">
        <h2 className="md-headline-large">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="filled">Filled Button</Button>
          <Button variant="tonal">Tonal Button</Button>
          <Button variant="outlined">Outlined Button</Button>
          <Button variant="text">Text Button</Button>
        </div>
      </section>
      
      <section className="space-y-4">
        <h2 className="md-headline-large">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="md">
            <CardHeader>
              <CardTitle className="md-title-large">Standard Card</CardTitle>
              <CardDescription className="md-body-medium">
                This is a standard Material Design 3 card with appropriate elevation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="md-body-large">
                Cards contain related content and actions about a single subject.
              </p>
            </CardContent>
          </Card>
          
          <Card variant="mdElevated">
            <CardHeader>
              <CardTitle className="md-title-large">Elevated Card</CardTitle>
              <CardDescription className="md-body-medium">
                This is an elevated Material Design 3 card with higher elevation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="md-body-large">
                Elevated cards are used when the card needs to stand out from the background.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <section className="space-y-4">
        <h2 className="md-headline-large">Inputs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Label className="md-label-large">Filled Input</Label>
            <Input variant="filled" placeholder="Enter your text here" />
          </div>
          
          <div className="space-y-4">
            <Label className="md-label-large">Outlined Input</Label>
            <Input variant="outlined" placeholder="Enter your text here" />
          </div>
        </div>
      </section>
      
      <section className="space-y-4">
        <h2 className="md-headline-large">Dialog</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="filled">Open Dialog</Button>
          </DialogTrigger>
          <DialogContent className="md-dialog">
            <DialogHeader>
              <DialogTitle className="md-headline-small">Dialog Title</DialogTitle>
              <DialogDescription className="md-body-medium">
                This is a Material Design 3 dialog with appropriate elevation and styling.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="md-body-large">
                Dialogs provide important prompts in a user flow. They can require an action, 
                communicate information, or help users accomplish a task.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}