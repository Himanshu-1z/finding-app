IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
CREATE TABLE [Interests] (
    [Id] uniqueidentifier NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [Emoji] nvarchar(max) NOT NULL,
    [Category] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_Interests] PRIMARY KEY ([Id])
);

CREATE TABLE [Users] (
    [Id] uniqueidentifier NOT NULL,
    [AnonymousUsername] nvarchar(450) NOT NULL,
    [Email] nvarchar(450) NOT NULL,
    [PasswordHash] nvarchar(max) NOT NULL,
    [RealName] nvarchar(max) NOT NULL,
    [StudentIdNumber] nvarchar(max) NOT NULL,
    [StudentIdPhotoUrl] nvarchar(max) NOT NULL,
    [CollegeName] nvarchar(max) NOT NULL,
    [Branch] nvarchar(max) NOT NULL,
    [Department] nvarchar(max) NOT NULL,
    [YearSemester] nvarchar(max) NOT NULL,
    [MobileNumber] nvarchar(max) NOT NULL,
    [AvatarUrl] nvarchar(max) NULL,
    [Bio] nvarchar(max) NULL,
    [Interests] nvarchar(max) NULL,
    [VerificationStatus] int NOT NULL,
    [IsActive] bit NOT NULL,
    [IsAdmin] bit NOT NULL,
    [RefreshToken] nvarchar(max) NULL,
    [RefreshTokenExpiry] datetime2 NULL,
    [Gender] int NOT NULL,
    [DateOfBirth] date NOT NULL,
    [IsIdentityRevealed] bit NOT NULL,
    [Section] nvarchar(max) NOT NULL,
    [CapturedIdImage] nvarchar(max) NULL,
    [IsSetupComplete] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
);

CREATE TABLE [Confessions] (
    [Id] uniqueidentifier NOT NULL,
    [AuthorId] uniqueidentifier NOT NULL,
    [Content] nvarchar(max) NOT NULL,
    [Type] int NOT NULL,
    [TargetRealName] nvarchar(max) NULL,
    [TargetCollege] nvarchar(max) NULL,
    [TargetSemester] nvarchar(max) NULL,
    [AuthorCollege] nvarchar(max) NULL,
    [TargetUserId] uniqueidentifier NULL,
    [IsPublic] bit NOT NULL,
    [LikesCount] int NOT NULL,
    [IsApproved] bit NOT NULL,
    [IsDeleted] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Confessions] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Confessions_Users_AuthorId] FOREIGN KEY ([AuthorId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Confessions_Users_TargetUserId] FOREIGN KEY ([TargetUserId]) REFERENCES [Users] ([Id])
);

CREATE TABLE [Notifications] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [Type] int NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [Body] nvarchar(max) NOT NULL,
    [Data] nvarchar(max) NULL,
    [IsRead] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Notifications] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Notifications_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [Reports] (
    [Id] uniqueidentifier NOT NULL,
    [ReportedByUserId] uniqueidentifier NOT NULL,
    [ReportedUserId] uniqueidentifier NOT NULL,
    [Reason] int NOT NULL,
    [Details] nvarchar(max) NULL,
    [Status] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [ReviewedAt] datetime2 NULL,
    CONSTRAINT [PK_Reports] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Reports_Users_ReportedByUserId] FOREIGN KEY ([ReportedByUserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Reports_Users_ReportedUserId] FOREIGN KEY ([ReportedUserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [StudentVerifications] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [StudentIdPhotoUrl] nvarchar(max) NOT NULL,
    [ExtractedName] nvarchar(max) NULL,
    [ExtractedStudentId] nvarchar(max) NULL,
    [ExtractedCollege] nvarchar(max) NULL,
    [OcrConfidence] real NOT NULL,
    [Status] int NOT NULL,
    [AdminNotes] nvarchar(max) NULL,
    [ReviewedByAdminId] uniqueidentifier NULL,
    [SubmittedAt] datetime2 NOT NULL,
    [ReviewedAt] datetime2 NULL,
    CONSTRAINT [PK_StudentVerifications] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_StudentVerifications_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [UserInterests] (
    [UserId] uniqueidentifier NOT NULL,
    [InterestId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_UserInterests] PRIMARY KEY ([UserId], [InterestId]),
    CONSTRAINT [FK_UserInterests_Interests_InterestId] FOREIGN KEY ([InterestId]) REFERENCES [Interests] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_UserInterests_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [ConfessionComments] (
    [Id] uniqueidentifier NOT NULL,
    [ConfessionId] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [Content] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_ConfessionComments] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ConfessionComments_Confessions_ConfessionId] FOREIGN KEY ([ConfessionId]) REFERENCES [Confessions] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_ConfessionComments_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [InteractionRequests] (
    [Id] uniqueidentifier NOT NULL,
    [ConfessionId] uniqueidentifier NOT NULL,
    [TargetUserId] uniqueidentifier NOT NULL,
    [ConfessorId] uniqueidentifier NOT NULL,
    [TargetResponse] int NOT NULL,
    [ConfessorAction] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [RespondedAt] datetime2 NULL,
    CONSTRAINT [PK_InteractionRequests] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_InteractionRequests_Confessions_ConfessionId] FOREIGN KEY ([ConfessionId]) REFERENCES [Confessions] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_InteractionRequests_Users_ConfessorId] FOREIGN KEY ([ConfessorId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_InteractionRequests_Users_TargetUserId] FOREIGN KEY ([TargetUserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [ChatRooms] (
    [Id] uniqueidentifier NOT NULL,
    [InteractionRequestId] uniqueidentifier NOT NULL,
    [User1Id] uniqueidentifier NOT NULL,
    [User2Id] uniqueidentifier NOT NULL,
    [IsUnlocked] bit NOT NULL,
    [IsFreePeriod] bit NOT NULL,
    [FreePeriodEndsAt] datetime2 NOT NULL,
    [PaymentId] uniqueidentifier NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_ChatRooms] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ChatRooms_InteractionRequests_InteractionRequestId] FOREIGN KEY ([InteractionRequestId]) REFERENCES [InteractionRequests] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_ChatRooms_Users_User1Id] FOREIGN KEY ([User1Id]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_ChatRooms_Users_User2Id] FOREIGN KEY ([User2Id]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [ChatMessages] (
    [Id] uniqueidentifier NOT NULL,
    [ChatRoomId] uniqueidentifier NOT NULL,
    [SenderId] uniqueidentifier NOT NULL,
    [Content] nvarchar(max) NOT NULL,
    [Image] nvarchar(max) NULL,
    [FileName] nvarchar(max) NULL,
    [FileSize] nvarchar(max) NULL,
    [IsRead] bit NOT NULL,
    [SentAt] datetime2 NOT NULL,
    CONSTRAINT [PK_ChatMessages] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ChatMessages_ChatRooms_ChatRoomId] FOREIGN KEY ([ChatRoomId]) REFERENCES [ChatRooms] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_ChatMessages_Users_SenderId] FOREIGN KEY ([SenderId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [Payments] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [ChatRoomId] uniqueidentifier NOT NULL,
    [Amount] decimal(18,2) NOT NULL,
    [Currency] nvarchar(max) NOT NULL,
    [Status] int NOT NULL,
    [TransactionRef] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CompletedAt] datetime2 NULL,
    CONSTRAINT [PK_Payments] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Payments_ChatRooms_ChatRoomId] FOREIGN KEY ([ChatRoomId]) REFERENCES [ChatRooms] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Payments_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

CREATE INDEX [IX_ChatMessages_ChatRoomId] ON [ChatMessages] ([ChatRoomId]);

CREATE INDEX [IX_ChatMessages_SenderId] ON [ChatMessages] ([SenderId]);

CREATE UNIQUE INDEX [IX_ChatRooms_InteractionRequestId] ON [ChatRooms] ([InteractionRequestId]);

CREATE INDEX [IX_ChatRooms_User1Id] ON [ChatRooms] ([User1Id]);

CREATE INDEX [IX_ChatRooms_User2Id] ON [ChatRooms] ([User2Id]);

CREATE INDEX [IX_ConfessionComments_ConfessionId] ON [ConfessionComments] ([ConfessionId]);

CREATE INDEX [IX_ConfessionComments_UserId] ON [ConfessionComments] ([UserId]);

CREATE INDEX [IX_Confessions_AuthorId] ON [Confessions] ([AuthorId]);

CREATE INDEX [IX_Confessions_TargetUserId] ON [Confessions] ([TargetUserId]);

CREATE INDEX [IX_InteractionRequests_ConfessionId] ON [InteractionRequests] ([ConfessionId]);

CREATE INDEX [IX_InteractionRequests_ConfessorId] ON [InteractionRequests] ([ConfessorId]);

CREATE INDEX [IX_InteractionRequests_TargetUserId] ON [InteractionRequests] ([TargetUserId]);

CREATE INDEX [IX_Notifications_UserId] ON [Notifications] ([UserId]);

CREATE UNIQUE INDEX [IX_Payments_ChatRoomId] ON [Payments] ([ChatRoomId]);

CREATE INDEX [IX_Payments_UserId] ON [Payments] ([UserId]);

CREATE INDEX [IX_Reports_ReportedByUserId] ON [Reports] ([ReportedByUserId]);

CREATE INDEX [IX_Reports_ReportedUserId] ON [Reports] ([ReportedUserId]);

CREATE INDEX [IX_StudentVerifications_UserId] ON [StudentVerifications] ([UserId]);

CREATE INDEX [IX_UserInterests_InterestId] ON [UserInterests] ([InterestId]);

CREATE UNIQUE INDEX [IX_Users_AnonymousUsername] ON [Users] ([AnonymousUsername]);

CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260818152840_InitialCreate', N'9.0.1');

COMMIT;
GO

