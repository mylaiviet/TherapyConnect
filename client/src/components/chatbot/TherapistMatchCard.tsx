import { MapPin, Video, DollarSign, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TherapistMatch } from './types';

interface TherapistMatchCardProps {
  therapist: TherapistMatch;
}

/**
 * Therapist match result card displayed after matching stage
 * Shows key info and links to profile/booking
 */
export default function TherapistMatchCard({ therapist }: TherapistMatchCardProps) {
  const {
    id,
    name,
    credentials,
    specialties,
    location,
    sessionFormat,
    insurance,
    photoUrl,
  } = therapist;

  return (
    <Card className="bg-white border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        {/* Header with photo and name */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-gray-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-gray-900 truncate">
              {name}
            </h4>
            <p className="text-xs text-gray-600">{credentials}</p>
          </div>
        </div>

        {/* Specialties */}
        <div className="mb-3">
          <p className="text-xs text-gray-600 mb-1">Specialties:</p>
          <div className="flex flex-wrap gap-1">
            {specialties.slice(0, 3).map((specialty, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs bg-blue-100 text-blue-700"
              >
                {specialty}
              </Badge>
            ))}
            {specialties.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{specialties.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1 mb-3 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            <span>{location}</span>
          </div>

          <div className="flex items-center gap-2">
            <Video className="w-3 h-3" />
            <span>
              {sessionFormat.includes('virtual') && sessionFormat.includes('in-person')
                ? 'Virtual & In-person'
                : sessionFormat.includes('virtual')
                ? 'Virtual available'
                : 'In-person'}
            </span>
          </div>

          {insurance.length > 0 && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-3 h-3" />
              <span className="truncate">
                Accepts {insurance.slice(0, 2).join(', ')}
                {insurance.length > 2 && ` +${insurance.length - 2} more`}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => window.open(`/therapists/${id}`, '_blank')}
          >
            View Profile
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs bg-blue-600 hover:bg-blue-700"
            onClick={() => window.open(`/therapists/${id}#book`, '_blank')}
          >
            Book Consultation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
