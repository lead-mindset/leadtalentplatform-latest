import * as React from "react"
import { 
  Calendar, 
  MapPin, 
  Video, 
  Users, 
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  X,
  Menu,
  Search,
  Filter,
  Settings,
  User,
  Mail,
  Phone,
  Globe,
  Clock,
  Star,
  Heart,
  Share2,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  HelpCircle,
  LogIn,
  LogOut,
  Home,
  FileText,
  Image,
  Link,
  ExternalLink,
  Copy,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  MoreHorizontal,
  Save,
  Loader2,
  Building2,
  GraduationCap,
  Linkedin,
  UserRound,
  UserCheck,
  TrendingUp,
  ImagePlus,
  RotateCcw,
  Crown,
  Handshake,
  Map,
  Instagram,
  IdCard,
  Ticket,
  Compass,
  Lightbulb,
  BookOpen
} from "lucide-react"

import { IconWrapper } from "./icon-wrapper"

export {
  Calendar,
  MapPin,
  Video,
  Users,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  X,
  Menu,
  Search,
  Filter,
  Settings,
  User,
  Mail,
  Phone,
  Globe,
  Clock,
  Star,
  Heart,
  Share2,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  HelpCircle,
  LogIn,
  LogOut,
  Home,
  FileText,
  Image,
  Link,
  ExternalLink,
  Copy,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  MoreHorizontal,
  Save,
  Loader2,
  Building2,
  GraduationCap,
  Linkedin,
  UserRound,
  UserCheck,
  TrendingUp,
  ImagePlus,
  RotateCcw,
  Crown,
  Handshake,
  Map,
  Instagram,
  IdCard,
  Ticket,
  Compass,
  Lightbulb,
  BookOpen
}

export const Icons = {

  ChevronRight: (props: Omit<React.ComponentProps<typeof ChevronRight>, 'size'>) => (
    <IconWrapper size="sm" aria-hidden={true}>
      <ChevronRight {...props} />
    </IconWrapper>
  ),
  ChevronLeft: (props: Omit<React.ComponentProps<typeof ChevronLeft>, 'size'>) => (
    <IconWrapper size="sm" aria-hidden={true}>
      <ChevronLeft {...props} />
    </IconWrapper>
  ),
  ChevronDown: (props: Omit<React.ComponentProps<typeof ChevronDown>, 'size'>) => (
    <IconWrapper size="sm" aria-hidden={true}>
      <ChevronDown {...props} />
    </IconWrapper>
  ),
  ChevronUp: (props: Omit<React.ComponentProps<typeof ChevronUp>, 'size'>) => (
    <IconWrapper size="sm" aria-hidden={true}>
      <ChevronUp {...props} />
    </IconWrapper>
  ),

  Plus: (props: Omit<React.ComponentProps<typeof Plus>, 'size'>) => (
    <IconWrapper size="md" aria-label="Add">
      <Plus {...props} />
    </IconWrapper>
  ),
  Minus: (props: Omit<React.ComponentProps<typeof Minus>, 'size'>) => (
    <IconWrapper size="md" aria-label="Remove">
      <Minus {...props} />
    </IconWrapper>
  ),
  X: (props: Omit<React.ComponentProps<typeof X>, 'size'>) => (
    <IconWrapper size="md" aria-label="Close">
      <X {...props} />
    </IconWrapper>
  ),
  Edit: (props: Omit<React.ComponentProps<typeof Edit>, 'size'>) => (
    <IconWrapper size="md" aria-label="Edit">
      <Edit {...props} />
    </IconWrapper>
  ),
  Trash2: (props: Omit<React.ComponentProps<typeof Trash2>, 'size'>) => (
    <IconWrapper size="md" aria-label="Delete">
      <Trash2 {...props} />
    </IconWrapper>
  ),

  Menu: (props: Omit<React.ComponentProps<typeof Menu>, 'size'>) => (
    <IconWrapper size="md" aria-label="Menu">
      <Menu {...props} />
    </IconWrapper>
  ),
  Search: (props: Omit<React.ComponentProps<typeof Search>, 'size'>) => (
    <IconWrapper size="md" aria-label="Search">
      <Search {...props} />
    </IconWrapper>
  ),
  Filter: (props: Omit<React.ComponentProps<typeof Filter>, 'size'>) => (
    <IconWrapper size="md" aria-label="Filter">
      <Filter {...props} />
    </IconWrapper>
  ),
  Settings: (props: Omit<React.ComponentProps<typeof Settings>, 'size'>) => (
    <IconWrapper size="md" aria-label="Settings">
      <Settings {...props} />
    </IconWrapper>
  ),

  User: (props: Omit<React.ComponentProps<typeof User>, 'size'>) => (
    <IconWrapper size="md" aria-label="User">
      <User {...props} />
    </IconWrapper>
  ),
  LogIn: (props: Omit<React.ComponentProps<typeof LogIn>, 'size'>) => (
    <IconWrapper size="md" aria-label="Sign in">
      <LogIn {...props} />
    </IconWrapper>
  ),
  LogOut: (props: Omit<React.ComponentProps<typeof LogOut>, 'size'>) => (
    <IconWrapper size="md" aria-label="Sign out">
      <LogOut {...props} />
    </IconWrapper>
  ),

  Calendar: (props: Omit<React.ComponentProps<typeof Calendar>, 'size'>) => (
    <IconWrapper size="sm" aria-label="Calendar">
      <Calendar {...props} />
    </IconWrapper>
  ),
  MapPin: (props: Omit<React.ComponentProps<typeof MapPin>, 'size'>) => (
    <IconWrapper size="sm" aria-label="Location">
      <MapPin {...props} />
    </IconWrapper>
  ),
  Video: (props: Omit<React.ComponentProps<typeof Video>, 'size'>) => (
    <IconWrapper size="sm" aria-label="Video">
      <Video {...props} />
    </IconWrapper>
  ),
  Users: (props: Omit<React.ComponentProps<typeof Users>, 'size'>) => (
    <IconWrapper size="sm" aria-label="Attendees">
      <Users {...props} />
    </IconWrapper>
  ),
  Clock: (props: Omit<React.ComponentProps<typeof Clock>, 'size'>) => (
    <IconWrapper size="sm" aria-label="Time">
      <Clock {...props} />
    </IconWrapper>
  ),

  CheckCircle2: (props: Omit<React.ComponentProps<typeof CheckCircle2>, 'size'>) => (
    <IconWrapper size="sm" aria-label="Success">
      <CheckCircle2 {...props} />
    </IconWrapper>
  ),
  AlertCircle: (props: Omit<React.ComponentProps<typeof AlertCircle>, 'size'>) => (
    <IconWrapper size="sm" aria-label="Alert">
      <AlertCircle {...props} />
    </IconWrapper>
  ),
  Info: (props: Omit<React.ComponentProps<typeof Info>, 'size'>) => (
    <IconWrapper size="sm" aria-label="Information">
      <Info {...props} />
    </IconWrapper>
  ),

  Mail: (props: Omit<React.ComponentProps<typeof Mail>, 'size'>) => (
    <IconWrapper size="md" aria-label="Email">
      <Mail {...props} />
    </IconWrapper>
  ),
  Phone: (props: Omit<React.ComponentProps<typeof Phone>, 'size'>) => (
    <IconWrapper size="md" aria-label="Phone">
      <Phone {...props} />
    </IconWrapper>
  ),
  Globe: (props: Omit<React.ComponentProps<typeof Globe>, 'size'>) => (
    <IconWrapper size="md" aria-label="Website">
      <Globe {...props} />
    </IconWrapper>
  ),

  FileText: (props: Omit<React.ComponentProps<typeof FileText>, 'size'>) => (
    <IconWrapper size="md" aria-label="Document">
      <FileText {...props} />
    </IconWrapper>
  ),
  Image: (props: Omit<React.ComponentProps<typeof Image>, 'size'>) => (
    <IconWrapper size="md" aria-label="Image">
      <Image {...props} />
    </IconWrapper>
  ),
  Link: (props: Omit<React.ComponentProps<typeof Link>, 'size'>) => (
    <IconWrapper size="md" aria-label="Link">
      <Link {...props} />
    </IconWrapper>
  ),
  ExternalLink: (props: Omit<React.ComponentProps<typeof ExternalLink>, 'size'>) => (
    <IconWrapper size="md" aria-label="External link">
      <ExternalLink {...props} />
    </IconWrapper>
  ),

  Share2: (props: Omit<React.ComponentProps<typeof Share2>, 'size'>) => (
    <IconWrapper size="md" aria-label="Share">
      <Share2 {...props} />
    </IconWrapper>
  ),
  Download: (props: Omit<React.ComponentProps<typeof Download>, 'size'>) => (
    <IconWrapper size="md" aria-label="Download">
      <Download {...props} />
    </IconWrapper>
  ),
  Upload: (props: Omit<React.ComponentProps<typeof Upload>, 'size'>) => (
    <IconWrapper size="md" aria-label="Upload">
      <Upload {...props} />
    </IconWrapper>
  ),
  Copy: (props: Omit<React.ComponentProps<typeof Copy>, 'size'>) => (
    <IconWrapper size="md" aria-label="Copy">
      <Copy {...props} />
    </IconWrapper>
  ),

  Home: (props: Omit<React.ComponentProps<typeof Home>, 'size'>) => (
    <IconWrapper size="md" aria-label="Home">
      <Home {...props} />
    </IconWrapper>
  ),
  ArrowRight: (props: Omit<React.ComponentProps<typeof ArrowRight>, 'size'>) => (
    <IconWrapper size="sm" aria-hidden={true}>
      <ArrowRight {...props} />
    </IconWrapper>
  ),
  ArrowLeft: (props: Omit<React.ComponentProps<typeof ArrowLeft>, 'size'>) => (
    <IconWrapper size="sm" aria-hidden={true}>
      <ArrowLeft {...props} />
    </IconWrapper>
  ),
  ArrowUp: (props: Omit<React.ComponentProps<typeof ArrowUp>, 'size'>) => (
    <IconWrapper size="sm" aria-hidden={true}>
      <ArrowUp {...props} />
    </IconWrapper>
  ),
  ArrowDown: (props: Omit<React.ComponentProps<typeof ArrowDown>, 'size'>) => (
    <IconWrapper size="sm" aria-hidden={true}>
      <ArrowDown {...props} />
    </IconWrapper>
  ),

  MoreVertical: (props: Omit<React.ComponentProps<typeof MoreVertical>, 'size'>) => (
    <IconWrapper size="md" aria-label="More options">
      <MoreVertical {...props} />
    </IconWrapper>
  ),
  MoreHorizontal: (props: Omit<React.ComponentProps<typeof MoreHorizontal>, 'size'>) => (
    <IconWrapper size="md" aria-label="More options">
      <MoreHorizontal {...props} />
    </IconWrapper>
  ),

  Lock: (props: Omit<React.ComponentProps<typeof Lock>, 'size'>) => (
    <IconWrapper size="md" aria-label="Locked">
      <Lock {...props} />
    </IconWrapper>
  ),
  Unlock: (props: Omit<React.ComponentProps<typeof Unlock>, 'size'>) => (
    <IconWrapper size="md" aria-label="Unlocked">
      <Unlock {...props} />
    </IconWrapper>
  ),

  Eye: (props: Omit<React.ComponentProps<typeof Eye>, 'size'>) => (
    <IconWrapper size="md" aria-label="Show">
      <Eye {...props} />
    </IconWrapper>
  ),
  EyeOff: (props: Omit<React.ComponentProps<typeof EyeOff>, 'size'>) => (
    <IconWrapper size="md" aria-label="Hide">
      <EyeOff {...props} />
    </IconWrapper>
  ),

  CheckCircle: (props: Omit<React.ComponentProps<typeof CheckCircle>, 'size'>) => (
    <IconWrapper size="md" aria-label="Completed">
      <CheckCircle {...props} />
    </IconWrapper>
  ),
  XCircle: (props: Omit<React.ComponentProps<typeof XCircle>, 'size'>) => (
    <IconWrapper size="md" aria-label="Failed">
      <XCircle {...props} />
    </IconWrapper>
  ),

  Star: (props: Omit<React.ComponentProps<typeof Star>, 'size'>) => (
    <IconWrapper size="md" aria-label="Star">
      <Star {...props} />
    </IconWrapper>
  ),
  Heart: (props: Omit<React.ComponentProps<typeof Heart>, 'size'>) => (
    <IconWrapper size="md" aria-label="Like">
      <Heart {...props} />
    </IconWrapper>
  ),

  HelpCircle: (props: Omit<React.ComponentProps<typeof HelpCircle>, 'size'>) => (
    <IconWrapper size="md" aria-label="Help">
      <HelpCircle {...props} />
    </IconWrapper>
  ),

  Save: (props: Omit<React.ComponentProps<typeof Save>, 'size'>) => (
    <IconWrapper size="md" aria-label="Save">
      <Save {...props} />
    </IconWrapper>
  ),

  Loader2: (props: Omit<React.ComponentProps<typeof Loader2>, 'size'>) => (
    <IconWrapper size="md" aria-hidden={true}>
      <Loader2 {...props} />
    </IconWrapper>
  ),

  Building2: (props: Omit<React.ComponentProps<typeof Building2>, 'size'>) => (
    <IconWrapper size="md" aria-label="Building">
      <Building2 {...props} />
    </IconWrapper>
  ),

  GraduationCap: (props: Omit<React.ComponentProps<typeof GraduationCap>, 'size'>) => (
    <IconWrapper size="md" aria-label="Graduation">
      <GraduationCap {...props} />
    </IconWrapper>
  ),

  Linkedin: (props: Omit<React.ComponentProps<typeof Linkedin>, 'size'>) => (
    <IconWrapper size="md" aria-label="LinkedIn">
      <Linkedin {...props} />
    </IconWrapper>
  ),

  UserRound: (props: Omit<React.ComponentProps<typeof UserRound>, 'size'>) => (
    <IconWrapper size="md" aria-label="User">
      <UserRound {...props} />
    </IconWrapper>
  ),

  UserCheck: (props: Omit<React.ComponentProps<typeof UserCheck>, 'size'>) => (
    <IconWrapper size="md" aria-label="Verified User">
      <UserCheck {...props} />
    </IconWrapper>
  ),

  TrendingUp: (props: Omit<React.ComponentProps<typeof TrendingUp>, 'size'>) => (
    <IconWrapper size="md" aria-label="Trending Up">
      <TrendingUp {...props} />
    </IconWrapper>
  ),

  ImagePlus: (props: Omit<React.ComponentProps<typeof ImagePlus>, 'size'>) => (
    <IconWrapper size="md" aria-label="Add Image">
      <ImagePlus {...props} />
    </IconWrapper>
  ),

  RotateCcw: (props: Omit<React.ComponentProps<typeof RotateCcw>, 'size'>) => (
    <IconWrapper size="md" aria-label="Rotate">
      <RotateCcw {...props} />
    </IconWrapper>
  ),

  Crown: (props: Omit<React.ComponentProps<typeof Crown>, 'size'>) => (
    <IconWrapper size="md" aria-label="Premium">
      <Crown {...props} />
    </IconWrapper>
  ),

  Handshake: (props: Omit<React.ComponentProps<typeof Handshake>, 'size'>) => (
    <IconWrapper size="md" aria-label="Partnership">
      <Handshake {...props} />
    </IconWrapper>
  ),

  Map: (props: Omit<React.ComponentProps<typeof Map>, 'size'>) => (
    <IconWrapper size="md" aria-label="Map">
      <Map {...props} />
    </IconWrapper>
  ),

  Instagram: (props: Omit<React.ComponentProps<typeof Instagram>, 'size'>) => (
    <IconWrapper size="md" aria-label="Instagram">
      <Instagram {...props} />
    </IconWrapper>
  ),

  IdCard: (props: Omit<React.ComponentProps<typeof IdCard>, 'size'>) => (
    <IconWrapper size="md" aria-label="ID Card">
      <IdCard {...props} />
    </IconWrapper>
  ),

  Ticket: (props: Omit<React.ComponentProps<typeof Ticket>, 'size'>) => (
    <IconWrapper size="md" aria-label="Ticket">
      <Ticket {...props} />
    </IconWrapper>
  ),

  Compass: (props: Omit<React.ComponentProps<typeof Compass>, 'size'>) => (
    <IconWrapper size="md" aria-label="Compass">
      <Compass {...props} />
    </IconWrapper>
  ),

  Lightbulb: (props: Omit<React.ComponentProps<typeof Lightbulb>, 'size'>) => (
    <IconWrapper size="md" aria-label="Tips">
      <Lightbulb {...props} />
    </IconWrapper>
  ),

  BookOpen: (props: Omit<React.ComponentProps<typeof BookOpen>, 'size'>) => (
    <IconWrapper size="md" aria-label="Resources">
      <BookOpen {...props} />
    </IconWrapper>
  ),
}
