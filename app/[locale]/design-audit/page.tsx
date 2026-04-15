import React from 'react';
import { 
  Alert, 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui';


export default function DesignAudit() {
  return (
    <div className="container mx-auto py-8 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl">Design System Audit</h1>
        <p className="text-lg text-muted-foreground">
          Complete overview of typography, components, and styles
        </p>
      </div>

      {/* Typography Section */}
      <section className="space-y-6">
        <h2 className="text-3xl">Typography</h2>
        <div className="space-y-4 p-6 border rounded-lg">
          <div className="space-y-2">
            <h1>Heading 1 - 48px Display</h1>
            <p className="text-sm text-muted-foreground">Size: 48px, Weight: 800, Letter spacing: -0.025em, Line height: 1.05</p>
          </div>
          <div className="space-y-2">
            <h2>Heading 2 - 36px Large</h2>
            <p className="text-sm text-muted-foreground">Size: 36px, Weight: 700, Letter spacing: -0.02em, Line height: 1.1</p>
          </div>
          <div className="space-y-2">
            <h3>Heading 3 - 28px Medium</h3>
            <p className="text-sm text-muted-foreground">Size: 28px, Weight: 600, Letter spacing: -0.015em, Line height: 1.15</p>
          </div>
          <div className="space-y-2">
            <h4>Heading 4 - 22px Small</h4>
            <p className="text-sm text-muted-foreground">Size: 22px, Weight: 500, Letter spacing: -0.01em, Line height: 1.2</p>
          </div>
          <div className="space-y-2">
            <h5>Heading 5 - 18px X-Small</h5>
            <p className="text-sm text-muted-foreground">Size: 18px, Weight: 400, Letter spacing: -0.005em, Line height: 1.25</p>
          </div>
          <div className="space-y-2">
            <h6>Heading 6 - 14px Micro</h6>
            <p className="text-sm text-muted-foreground">Size: 14px, Weight: 400, Letter spacing: 0em, Line height: 1.3</p>
          </div>
          <Separator />
          <p className="text-base">Paragraph text - Open Sans regular. This is how your body text will appear throughout the application. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          <p className="text-sm">Small text - Open Sans small. Used for captions, metadata, and secondary information.</p>
          <p className="text-xs">Extra small text - Open Sans extra small. Used for fine print and disclaimers.</p>
        </div>
      </section>

      {/* Colors Section */}
      <section className="space-y-6">
        <h2 className="text-3xl">Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="w-full h-20 bg-primary rounded"></div>
            <p className="text-sm font-medium">Primary</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-20 bg-secondary rounded"></div>
            <p className="text-sm font-medium">Secondary</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-20 bg-muted rounded"></div>
            <p className="text-sm font-medium">Muted</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-20 bg-accent rounded"></div>
            <p className="text-sm font-medium">Accent</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-20 bg-destructive rounded"></div>
            <p className="text-sm font-medium">Destructive</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-20 bg-success rounded"></div>
            <p className="text-sm font-medium">Success</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-20 bg-warning rounded"></div>
            <p className="text-sm font-medium">Warning</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-20 bg-info rounded"></div>
            <p className="text-sm font-medium">Info</p>
          </div>
        </div>
      </section>

      {/* Gradients Section */}
      <section className="space-y-6">
        <h2 className="text-3xl">Gradients</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="w-full h-20 bg-gradient-body rounded"></div>
            <p className="text-sm font-medium">Body Gradient</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-20 bg-gradient-card rounded"></div>
            <p className="text-sm font-medium">Card Gradient</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-20 bg-gradient-popover rounded"></div>
            <p className="text-sm font-medium">Popover Gradient</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-20 bg-gradient-sidebar rounded"></div>
            <p className="text-sm font-medium">Sidebar Gradient</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-20 bg-gradient-input rounded"></div>
            <p className="text-sm font-medium">Input Gradient</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-20 bg-gradient-muted rounded"></div>
            <p className="text-sm font-medium">Muted Gradient</p>
          </div>
        </div>
      </section>

      {/* Buttons Section */}
      <section className="space-y-6">
        <h2 className="text-3xl ">Buttons</h2>
        <div className="flex flex-wrap gap-4 p-6 border rounded-lg">
          <Button>Default Button</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="info">Info</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      {/* Form Elements Section */}
      <section className="space-y-6">
        <h2 className="text-3xl ">Form Elements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border rounded-lg">
          <div className="space-y-4">
            <div>
              <Label htmlFor="input">Input Field</Label>
              <Input id="input" placeholder="Enter text here..." />
            </div>
            <div>
              <Label htmlFor="textarea">Textarea</Label>
              <Textarea id="textarea" placeholder="Enter longer text here..." />
            </div>
            <div>
              <Label htmlFor="select">Select</Label>
              <Select>
                <SelectTrigger id="select">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="checkbox" />
              <Label htmlFor="checkbox">Checkbox option</Label>
            </div>
            <div className="space-y-2">
              <Label>Toggles</Label>
              <div className="flex gap-2">
                <Toggle>Toggle</Toggle>
                <Toggle variant="outline">Outline</Toggle>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Toggle Group</Label>
              <ToggleGroup type="single">
                <ToggleGroupItem value="left">Left</ToggleGroupItem>
                <ToggleGroupItem value="center">Center</ToggleGroupItem>
                <ToggleGroupItem value="right">Right</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
      </section>

      {/* Cards Section */}
      <section className="space-y-6">
        <h2 className="text-3xl ">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description goes here</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This is the card content area. It can contain any type of content.</p>
            </CardContent>
            <CardFooter>
              <Button>Card Action</Button>
            </CardFooter>
          </Card>
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle>Gradient Card</CardTitle>
              <CardDescription>Card with gradient background</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This card uses the gradient background from your design system.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline">Outline Action</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Badges and Alerts Section */}
      <section className="space-y-6">
        <h2 className="text-3xl ">Badges & Alerts</h2>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 p-6 border rounded-lg">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
          </div>
          <div className="space-y-4 p-6 border rounded-lg">
            <Alert>
              This is a default alert message.
            </Alert>
            <Alert variant="destructive">
              This is a destructive alert message.
            </Alert>
            <Alert variant="success">
              This is a success alert message.
            </Alert>
            <Alert variant="warning">
              This is a warning alert message.
            </Alert>
            <Alert variant="info">
              This is an info alert message.
            </Alert>
          </div>
        </div>
      </section>

      {/* Tables Section */}
      <section className="space-y-6">
        <h2 className="text-3xl ">Tables</h2>
        <div className="p-6 border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">John Doe</TableCell>
                <TableCell><Badge variant="success">Active</Badge></TableCell>
                <TableCell>Developer</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline">Edit</Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Jane Smith</TableCell>
                <TableCell><Badge variant="warning">Pending</Badge></TableCell>
                <TableCell>Designer</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline">Edit</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Dialogs and Overlays Section */}
      <section className="space-y-6">
        <h2 className="text-3xl ">Dialogs & Overlays</h2>
        <div className="flex flex-wrap gap-4 p-6 border rounded-lg">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog Title</DialogTitle>
                <DialogDescription>
                  This is a dialog description. It provides context for the dialog content.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p>Dialog content goes here.</p>
              </div>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Open Alert Dialog</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account
                  and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover for Tooltip</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>This is a tooltip message</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </section>

      {/* Avatar Section */}
      <section className="space-y-6">
        <h2 className="text-3xl ">Avatars</h2>
        <div className="flex flex-wrap gap-4 p-6 border rounded-lg">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <Avatar className="w-16 h-16">
            <AvatarFallback>Large</AvatarFallback>
          </Avatar>
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs">XS</AvatarFallback>
          </Avatar>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="space-y-6">
        <h2 className="text-3xl ">Tabs</h2>
        <div className="p-6 border rounded-lg">
          <Tabs defaultValue="account" className="w-full">
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="space-y-4">
              <h3 className="text-lg font-semibold">Account Settings</h3>
              <p>Manage your account settings and preferences.</p>
            </TabsContent>
            <TabsContent value="password" className="space-y-4">
              <h3 className="text-lg font-semibold">Password</h3>
              <p>Change your password and security settings.</p>
            </TabsContent>
            <TabsContent value="notifications" className="space-y-4">
              <h3 className="text-lg font-semibold">Notifications</h3>
              <p>Configure your notification preferences.</p>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Dropdown Menu Section */}
      <section className="space-y-6">
        <h2 className="text-3xl ">Dropdown Menus</h2>
        <div className="flex flex-wrap gap-4 p-6 border rounded-lg">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Keyboard shortcuts</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </section>

      {/* Loading States Section */}
      <section className="space-y-6">
        <h2 className="text-3xl ">Loading States</h2>
        <div className="space-y-4 p-6 border rounded-lg">
          <div className="space-y-2">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-3/4 h-4" />
            <Skeleton className="w-1/2 h-4" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="w-32 h-4" />
              <Skeleton className="w-24 h-3" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
