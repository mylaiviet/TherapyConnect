import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  Building,
  MapPin,
  Phone,
  Award,
  Calendar,
  Save,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface NPIVerificationResult {
  valid: boolean;
  npiNumber?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  credentials?: string;
  specialty?: string;
  specialtyDescription?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  enumerationType?: "Individual" | "Organization";
  enumerationDate?: string;
  lastUpdated?: string;
  status?: string;
  taxonomies?: Array<{
    code: string;
    description: string;
    primary: boolean;
    license?: string;
    state?: string;
  }>;
  error?: string;
}

export default function NPIVerificationForm() {
  const [npiNumber, setNpiNumber] = useState("");
  const [verificationResult, setVerificationResult] =
    useState<NPIVerificationResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

  // Fetch credentialing status to check for existing NPI
  const { data: credentialingStatus, isLoading: statusLoading } = useQuery<any>({
    queryKey: ["/api/therapist/credentialing/status"],
  });

  // Check if NPI is already verified
  const existingNPI = credentialingStatus?.therapistInfo?.npiNumber;
  const npiVerification = credentialingStatus?.verifications?.find(
    (v: any) => v.verificationType === "npi" && v.status === "verified"
  );

  // Verify NPI mutation
  const verifyMutation = useMutation({
    mutationFn: async (npi: string) => {
      const response = await fetch("/api/credentialing/verify-npi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ npiNumber: npi }),
      });

      if (!response.ok) {
        throw new Error("Failed to verify NPI");
      }

      return response.json();
    },
    onSuccess: (data: NPIVerificationResult) => {
      setVerificationResult(data);
      setShowDetails(data.valid);
      setIsSaved(false); // Reset saved state on new verification
    },
    onError: (error: any) => {
      setVerificationResult({
        valid: false,
        error: error.message || "Failed to verify NPI",
      });
    },
  });

  // Save NPI to profile mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { npiNumber: string; verificationData: NPIVerificationResult }) => {
      const response = await fetch("/api/therapist/credentialing/save-npi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save NPI");
      }

      return response.json();
    },
    onSuccess: () => {
      setIsSaved(true);
      toast({
        title: "NPI Saved",
        description: "Your NPI has been saved to your profile successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save NPI to profile",
        variant: "destructive",
      });
    },
  });

  const handleVerify = () => {
    if (!npiNumber || npiNumber.trim().length !== 10) {
      setVerificationResult({
        valid: false,
        error: "Please enter a valid 10-digit NPI number",
      });
      return;
    }

    verifyMutation.mutate(npiNumber.trim());
  };

  const handleSave = () => {
    if (verificationResult && verificationResult.valid && verificationResult.npiNumber) {
      saveMutation.mutate({
        npiNumber: verificationResult.npiNumber,
        verificationData: verificationResult,
      });
    }
  };

  const handleNpiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Only digits
    if (value.length <= 10) {
      setNpiNumber(value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  const formatNPI = (npi: string) => {
    if (npi.length !== 10) return npi;
    return `${npi.slice(0, 4)}-${npi.slice(4, 7)}-${npi.slice(7)}`;
  };

  return (
    <div className="space-y-6">
      {/* Existing Verified NPI Status */}
      {existingNPI && npiVerification && (
        <Card className="border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle className="h-5 w-5" />
              NPI Verified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">
                      NPI: {existingNPI}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {credentialingStatus.therapistInfo.firstName}{" "}
                      {credentialingStatus.therapistInfo.lastName}
                    </div>
                  </div>
                </div>
                <Badge className="bg-green-600">Verified</Badge>
              </div>

              {/* Verification Details */}
              <div className="space-y-2 p-4 bg-white rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Verification Status
                  </span>
                  <span className="text-sm font-medium text-green-700">
                    ✓ Active and Verified
                  </span>
                </div>

                {npiVerification.verificationDate && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Last Verified
                      </span>
                      <span className="text-sm font-medium">
                        {formatDistanceToNow(
                          new Date(npiVerification.verificationDate),
                          { addSuffix: true }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Verification Date
                      </span>
                      <span className="text-sm font-medium">
                        {new Date(
                          npiVerification.verificationDate
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </>
                )}

                {npiVerification.verificationSource && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Verified By
                    </span>
                    <span className="text-sm font-medium">
                      {npiVerification.verificationSource}
                    </span>
                  </div>
                )}

                {npiVerification.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="text-sm">{npiVerification.notes}</p>
                  </div>
                )}
              </div>

              {/* Re-verify option */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your NPI is already verified and active. If you need to update or
                  re-verify your NPI, you can do so using the form below.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

      {/* NPI Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {existingNPI ? (
              <>
                <RefreshCw className="h-5 w-5 text-blue-500" />
                Update or Re-verify NPI
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 text-blue-500" />
                NPI Verification
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {existingNPI ? (
                <>
                  To update or re-verify your NPI, enter a new 10-digit NPI number below.
                  This will replace your current verified NPI.
                </>
              ) : (
                <>
                  Enter your 10-digit National Provider Identifier (NPI) to verify
                  your credentials with the national registry. This is required for
                  credentialing approval.
                </>
              )}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label htmlFor="npi-number">NPI Number</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="npi-number"
                  type="text"
                  placeholder="Enter 10-digit NPI"
                  value={npiNumber}
                  onChange={handleNpiChange}
                  onKeyPress={handleKeyPress}
                  maxLength={10}
                  className="font-mono text-lg"
                  disabled={verifyMutation.isPending}
                />
                <Button
                  onClick={handleVerify}
                  disabled={
                    verifyMutation.isPending || npiNumber.length !== 10
                  }
                  className="min-w-[120px]"
                >
                  {verifyMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your NPI is a unique 10-digit identification number. Don't know
                your NPI?{" "}
                <a
                  href="https://npiregistry.cms.hhs.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Search the registry
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Result */}
      {verificationResult && (
        <Card
          className={
            verificationResult.valid
              ? "border-green-500 bg-green-50"
              : "border-red-500 bg-red-50"
          }
        >
          <CardHeader>
            <CardTitle
              className={`flex items-center gap-2 ${
                verificationResult.valid ? "text-green-900" : "text-red-900"
              }`}
            >
              {verificationResult.valid ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Verification Successful
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5" />
                  Verification Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {verificationResult.valid ? (
              <div className="space-y-4">
                {/* Provider Summary */}
                <div className="p-4 bg-white rounded-lg border">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {verificationResult.name}
                        {verificationResult.credentials && (
                          <span className="text-muted-foreground ml-2">
                            {verificationResult.credentials}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        NPI: {formatNPI(verificationResult.npiNumber || "")}
                      </p>
                    </div>
                    <Badge
                      className={
                        verificationResult.status === "A"
                          ? "bg-green-500"
                          : "bg-gray-500"
                      }
                    >
                      {verificationResult.status === "A"
                        ? "Active"
                        : "Inactive"}
                    </Badge>
                  </div>

                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {verificationResult.enumerationType && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium">
                          {verificationResult.enumerationType}
                        </span>
                      </div>
                    )}

                    {verificationResult.specialtyDescription && (
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-muted-foreground">
                          Specialty:
                        </span>
                        <span className="font-medium">
                          {verificationResult.specialtyDescription}
                        </span>
                      </div>
                    )}

                    {verificationResult.city && verificationResult.state && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium">
                          {verificationResult.city}, {verificationResult.state}
                        </span>
                      </div>
                    )}

                    {verificationResult.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium">
                          {verificationResult.phone}
                        </span>
                      </div>
                    )}

                    {verificationResult.enumerationDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-muted-foreground">
                          Enumerated:
                        </span>
                        <span className="font-medium">
                          {new Date(
                            verificationResult.enumerationDate
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Full Address */}
                  {verificationResult.address && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        Practice Address
                      </p>
                      <p className="text-sm">
                        {verificationResult.address}
                        <br />
                        {verificationResult.city}, {verificationResult.state}{" "}
                        {verificationResult.zipCode}
                      </p>
                    </div>
                  )}
                </div>

                {/* Taxonomies/Licenses */}
                {verificationResult.taxonomies &&
                  verificationResult.taxonomies.length > 0 && (
                    <div className="p-4 bg-white rounded-lg border">
                      <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="w-full flex items-center justify-between text-sm font-medium text-gray-900 mb-2"
                      >
                        <span>
                          Licensed Specialties ({verificationResult.taxonomies.length})
                        </span>
                        <span className="text-blue-600">
                          {showDetails ? "Hide" : "Show"} Details
                        </span>
                      </button>

                      {showDetails && (
                        <div className="space-y-2 mt-3">
                          {verificationResult.taxonomies.map((taxonomy, idx) => (
                            <div
                              key={idx}
                              className="flex items-start justify-between p-2 bg-gray-50 rounded"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {taxonomy.description}
                                  </span>
                                  {taxonomy.primary && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Primary
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Code: {taxonomy.code}
                                  {taxonomy.license && (
                                    <>
                                      {" "}
                                      • License: {taxonomy.license}
                                      {taxonomy.state && ` (${taxonomy.state})`}
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                {/* Success Message with Save Button */}
                {!isSaved ? (
                  <div className="space-y-3">
                    <Alert className="border-green-500 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-900">
                        Your NPI has been successfully verified with the national
                        registry. Click "Save to Profile" to add this to your
                        credentialing application.
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={handleSave}
                      disabled={saveMutation.isPending}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      {saveMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save to Profile
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <Alert className="border-green-600 bg-green-100">
                    <CheckCircle className="h-4 w-4 text-green-700" />
                    <AlertDescription className="text-green-900 font-medium">
                      ✅ NPI saved successfully! Your verified NPI has been added to
                      your profile and will be used in your credentialing application.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {verificationResult.error ||
                    "Unable to verify this NPI number. Please check that you entered it correctly and try again."}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About NPI Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p>
                <strong>What is an NPI?</strong> The National Provider
                Identifier (NPI) is a unique 10-digit identification number
                issued to healthcare providers in the United States.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Where to find your NPI:</strong> Your NPI can be found
                on your professional license, insurance cards, or by searching
                the{" "}
                <a
                  href="https://npiregistry.cms.hhs.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  National NPI Registry
                </a>
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Verification process:</strong> We verify your NPI
                against the official CMS National Provider Registry to confirm
                your credentials and practice information.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Need help?</strong> If you're having trouble finding or
                verifying your NPI, please contact our credentialing team at{" "}
                <a
                  href="mailto:credentialing@karematch.com"
                  className="text-blue-600 hover:underline"
                >
                  credentialing@karematch.com
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
