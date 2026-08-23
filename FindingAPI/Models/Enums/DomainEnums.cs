namespace FindingAPI.Models.Enums;

public enum VerificationStatus
{
    Pending = 1,
    Approved = 2,
    Rejected = 3
}

public enum ConfessionType
{
    Public = 1,
    Targeted = 2
}

public enum InteractionResponse
{
    Pending = 1,
    Liked = 2,
    InteractRequested = 3,
    Ignored = 4
}

public enum ConfessorResponse
{
    Pending = 1,
    Accepted = 2,
    Declined = 3
}

public enum PaymentStatus
{
    Pending = 1,
    Completed = 2,
    Failed = 3,
    Refunded = 4
}

public enum NotificationType
{
    ConfessionReceived = 1,
    InteractRequest = 2,
    RequestAccepted = 3,
    RequestDeclined = 4,
    NewMessage = 5,
    VerificationApproved = 6,
    VerificationRejected = 7,
    SystemAlert = 8
}

public enum ReportReason
{
    Spam = 1,
    Harassment = 2,
    InappropriateContent = 3,
    FakeProfile = 4,
    Underage = 5,
    Other = 99
}

public enum ReportStatus
{
    Pending = 1,
    UnderReview = 2,
    Resolved = 3,
    Dismissed = 4
}

public enum MessageType
{
    Text = 1,
    Image = 2,
    System = 3
}

public enum Gender
{
    Male = 1,
    Female = 2,
    Other = 3
}
