import {
  AlarmClockOff,
  AlertTriangle,
  Ambulance,
  Apple,
  ArrowLeft,
  ArrowRight,
  Award,
  Baby,
  Bell,
  Bone,
  Brain,
  BrainCircuit,
  Briefcase,
  BriefcaseMedical,
  Bug,
  Calendar,
  CalendarDays,
  Camera,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardClock,
  Clock,
  CloudRain,
  Crosshair,
  Droplet,
  Eye,
  FileText,
  Filter,
  FlaskConical,
  FlaskConicalIcon,
  Flower2,
  Heart,
  HeartHandshake,
  HeartPulse,
  Home,
  Hospital,
  Image,
  Info,
  LocateFixed,
  MapPin,
  MapPinOff,
  MessageSquare,
  Mic,
  MicOff,
  MilkIcon,
  Minus,
  Navigation,
  NotepadText,
  Percent,
  Phone,
  PhoneOff,
  Pill,
  Plus,
  RotateCcw,
  Route,
  Scan,
  ScanText,
  ScanTextIcon,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sliders,
  Smile,
  Snowflake,
  Star,
  Stethoscope,
  Store,
  Sun,
  Tag,
  TestTube,
  Thermometer,
  User,
  Users,
  Video,
  VideoOff,
  Wind,
  X,
  Trash2
} from 'lucide-react-native';

interface AppIconProps {
  name: 'alert-triangle' | 'home' | 'calendar' | 'records' | 'health' | 'profile' | 'bell' | 'shopping-bag' | 'map-pin' | 'chevron-left' | 'chevron-right' | 'chevron-down' | 'chevron-up' | 'search' | 'scan-text' | 'camera' | 'image' | 'pill' | 'stethoscope' | 'notepad-text' | 'calendar-days' | 'video' | 'clipboard-clock' | 'test-tube' | 'hospital' | 'ambulance' | 'home-heart' | 'clock' | 'star' | 'rotate-ccw' | 'plus' | 'minus' | 'arrow-left' | 'filter' | 'share' | 'check-circle' | 'users' | 'mic' | 'mic-off' | 'video-off' | 'phone-off' | 'message-square' | 'heart' | 'x' | 'sun' | 'baby' | 'bone' | 'brain' | 'apple' | 'wind' | 'droplet' | 'flask-conical' | 'brain-circuit' | 'flower-2' | 'eye' | 'briefcase-medical' | 'smile' | 'check' | 'sliders' | 'locate-fixed' | 'briefcase' | 'scan' | 'phone' | 'flask' | 'shield-check' | 'route' | 'navigation' | 'scan-text-icon' | 'store' | 'shopping-cart' | 'alarm-clock-off' | 'map-pin-off' | 'file-text' | 'arrow-right' | 'bug' | 'cloud-rain' | 'snowflake' | 'thermometer' | 'milk' | 'flashlight' | 'award' | 'info' | 'history' | 'clipboard-check' | 'percent' | 'tag' | 'crosshair' | 'trash';
  stroke?: number
  color: string;
  size?: number;
}

export default function AppIcon({
  name,
  color,
  size = 24,
}: AppIconProps) {
  switch (name) {
    case 'alert-triangle':
      return <AlertTriangle color={color} size={size} strokeWidth={1.8} />;
    case 'home':
      return <Home color={color} size={size} strokeWidth={1.8} />;
    case 'calendar':
      return <Calendar color={color} size={size} strokeWidth={1.8} />;
    case 'records':
      return <FileText color={color} size={size} strokeWidth={1.8} />;
    case 'health':
      return <HeartPulse color={color} size={size} strokeWidth={1.8} />;
    case 'profile':
      return <User color={color} size={size} strokeWidth={1.8} />;
    case 'bell':
      return <Bell color={color} size={size} strokeWidth={1.8} />;
    case 'shopping-bag':
      return <ShoppingBag color={color} size={size} strokeWidth={1.8} />;
    case 'map-pin':
      return <MapPin color={color} size={size} strokeWidth={1.8} />;
    case 'chevron-left':
      return <ChevronLeft color={color} size={size} strokeWidth={1.8} />;
    case 'chevron-right':
      return <ChevronRight color={color} size={size} strokeWidth={1.8} />;
    case 'chevron-down':
      return <ChevronDown color={color} size={size} strokeWidth={1.8} />;
    case 'chevron-up':
      return <ChevronUp color={color} size={size} strokeWidth={1.8} />;
    case 'search':
      return <Search color={color} size={size} strokeWidth={1.8} />;
    case 'scan-text':
      return <ScanText color={color} size={size} strokeWidth={1.8} />;
    case 'camera':
      return <Camera color={color} size={size} strokeWidth={1.8} />;
    case 'image':
      return <Image color={color} size={size} strokeWidth={1.8} />;
    case 'pill':
      return <Pill color={color} size={size} strokeWidth={1.8} />;
    case 'stethoscope':
      return <Stethoscope color={color} size={size} strokeWidth={1.8} />;
    case 'notepad-text':
      return <NotepadText color={color} size={size} strokeWidth={1.8} />;
    case 'calendar-days':
      return <CalendarDays color={color} size={size} strokeWidth={1.8} />;
    case 'video':
      return <Video color={color} size={size} strokeWidth={1.8} />;
    case 'clipboard-clock':
      return <ClipboardClock color={color} size={size} strokeWidth={1.8} />;
    case 'test-tube':
      return <TestTube color={color} size={size} strokeWidth={1.8} />;
    case 'hospital':
      return <Hospital color={color} size={size} strokeWidth={1.8} />;
    case 'ambulance':
      return <Ambulance color={color} size={size} strokeWidth={1.8} />;
    case 'home-heart':
      return <HeartHandshake color={color} size={size} strokeWidth={1.8} />;
    case 'clock':
      return <Clock color={color} size={size} strokeWidth={1.8} />;
    case 'star':
      return <Star color={color} size={size} strokeWidth={1.8} />;
    case 'rotate-ccw':
      return <RotateCcw color={color} size={size} strokeWidth={1.8} />;
    case 'plus':
      return <Plus color={color} size={size} strokeWidth={1.8} />;
    case 'minus':
      return <Minus color={color} size={size} strokeWidth={1.8} />;
    case 'arrow-left':
      return <ArrowLeft color={color} size={size} strokeWidth={1.8} />;
    case 'filter':
      return <Filter color={color} size={size} strokeWidth={1.8} />;
    case 'share':
      return <Share2 color={color} size={size} strokeWidth={1.8} />;
    case 'check-circle':
      return <CheckCircle color={color} size={size} strokeWidth={1.8} />;
    case 'users':
      return <Users color={color} size={size} strokeWidth={1.8} />;
    case 'mic':
      return <Mic color={color} size={size} strokeWidth={1.8} />;
    case 'mic-off':
      return <MicOff color={color} size={size} strokeWidth={1.8} />;
    case 'video-off':
      return <VideoOff color={color} size={size} strokeWidth={1.8} />;
    case 'phone-off':
      return <PhoneOff color={color} size={size} strokeWidth={1.8} />;
    case 'message-square':
      return <MessageSquare color={color} size={size} strokeWidth={1.8} />;
    case 'heart':
      return <Heart color={color} size={size} strokeWidth={1.8} />;
    case 'x':
      return <X color={color} size={size} strokeWidth={1.8} />;
    case 'sun':
      return <Sun color={color} size={size} strokeWidth={1.8} />;
    case 'baby':
      return <Baby color={color} size={size} strokeWidth={1.8} />;
    case 'bone':
      return <Bone color={color} size={size} strokeWidth={1.8} />;
    case 'brain':
      return <Brain color={color} size={size} strokeWidth={1.8} />;
    case 'apple':
      return <Apple color={color} size={size} strokeWidth={1.8} />;
    case 'wind':
      return <Wind color={color} size={size} strokeWidth={1.8} />;
    case 'droplet':
      return <Droplet color={color} size={size} strokeWidth={1.8} />;
    case 'flask-conical':
      return <FlaskConical color={color} size={size} strokeWidth={1.8} />;
    case 'brain-circuit':
      return <BrainCircuit color={color} size={size} strokeWidth={1.8} />;
    case 'flower-2':
      return <Flower2 color={color} size={size} strokeWidth={1.8} />;
    case 'eye':
      return <Eye color={color} size={size} strokeWidth={1.8} />;
    case 'briefcase-medical':
      return <BriefcaseMedical color={color} size={size} strokeWidth={1.8} />;
    case 'smile':
      return <Smile color={color} size={size} strokeWidth={1.8} />;
    case 'check':
      return <Check color={color} size={size} strokeWidth={1.8} />;
    case 'sliders':
      return <Sliders color={color} size={size} strokeWidth={1.8} />;
    case 'locate-fixed':
      return <LocateFixed color={color} size={size} strokeWidth={1.8} />;
    case 'briefcase':
      return <Briefcase color={color} size={size} strokeWidth={1.8} />;
    case 'scan':
      return <Scan color={color} size={size} strokeWidth={1.8} />;
    case 'phone':
      return <Phone color={color} size={size} strokeWidth={1.8} />;
    case 'flask':
      return <FlaskConicalIcon color={color} size={size} strokeWidth={1.8} />;
    case 'shield-check':
      return <ShieldCheck color={color} size={size} strokeWidth={1.8} />;
    case 'route':
      return <Route color={color} size={size} strokeWidth={1.8} />;
    case 'navigation':
      return <Navigation color={color} size={size} strokeWidth={1.8} />;
    case 'scan-text-icon':
      return <ScanTextIcon color={color} size={size} strokeWidth={1.8} />;
    case 'store':
      return <Store color={color} size={size} strokeWidth={1.8} />;
    case 'shopping-cart':
      return <ShoppingCart color={color} size={size} strokeWidth={1.8} />;
    case 'alarm-clock-off':
      return <AlarmClockOff color={color} size={size} strokeWidth={1.8} />;
    case 'map-pin-off':
      return <MapPinOff color={color} size={size} strokeWidth={1.8} />;
    case 'file-text':
      return <FileText color={color} size={size} strokeWidth={1.8} />
    case 'arrow-right':
      return <ArrowRight color={color} size={size} strokeWidth={1.8} />;
    case 'bug':
      return <Bug color={color} size={size} strokeWidth={1.8} />;
    case 'cloud-rain':
      return <CloudRain color={color} size={size} strokeWidth={1.8} />;
    case 'snowflake':
      return <Snowflake color={color} size={size} strokeWidth={1.8} />;
    case 'thermometer':
      return <Thermometer color={color} size={size} strokeWidth={1.8} />;
    case 'milk':
      return <MilkIcon color={color} size={size} strokeWidth={1.8} />;
    case 'award':
      return <Award color={color} size={size} strokeWidth={1.8} />;
    case 'info':
      return <Info color={color} size={size} strokeWidth={1.8} />;
    case 'history':
      return <RotateCcw color={color} size={size} strokeWidth={1.8} />;
    case 'clipboard-check':
      return <CheckCircle color={color} size={size} strokeWidth={1.8} />;
    case 'percent':
      return <Percent color={color} size={size} strokeWidth={1.8} />;
    case 'tag':
      return <Tag color={color} size={size} strokeWidth={1.8} />;
    case 'crosshair':
      return <Crosshair color={color} size={size} strokeWidth={1.8} />;
    case 'trash':
      return <Trash2 color={color} size={size} strokeWidth={1.8} />;
    default:
      return null;
  }
}
