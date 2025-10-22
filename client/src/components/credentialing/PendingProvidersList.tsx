import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Clock, AlertCircle } from "lucide-react";
import { type Therapist } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface PendingProvidersListProps {
  providers?: Therapist[];
  isLoading: boolean;
  onSelectProvider: (therapistId: string) => void;
}

export default function PendingProvidersList({
  providers,
  isLoading,
  onSelectProvider,
}: PendingProvidersListProps) {
  const getCredentialingStatusBadge = (status?: string) => {
    switch (status) {
      case 'not_started':
        return <Badge variant="secondary">Not Started</Badge>;
      case 'documents_pending':
        return <Badge variant="outline">Documents Pending</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-500">Under Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!providers || providers.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium">No pending credentialing requests</p>
            <p className="text-sm mt-2">All providers have been reviewed</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Credentialing Reviews ({providers.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>License Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.map((provider) => (
              <TableRow key={provider.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={provider.photoUrl || undefined} />
                      <AvatarFallback>
                        {getInitials(provider.firstName, provider.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {provider.firstName} {provider.lastName}
                        {provider.credentials && (
                          <span className="text-muted-foreground font-normal">
                            , {provider.credentials}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {provider.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{provider.licenseType || "Unknown"}</Badge>
                </TableCell>
                <TableCell>
                  {getCredentialingStatusBadge(provider.credentialingStatus || 'not_started')}
                </TableCell>
                <TableCell>
                  {provider.credentialingStartedAt ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(new Date(provider.credentialingStartedAt), {
                        addSuffix: true,
                      })}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not started</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {provider.city}, {provider.state}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectProvider(provider.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
