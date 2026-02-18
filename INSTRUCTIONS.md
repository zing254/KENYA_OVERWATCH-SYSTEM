# Kenya Overwatch - Milestone Feature Instructions

## Overview

The Milestone feature allows users to track project tasks, incident cases, and evidence reviews through a structured approval workflow with mentor oversight.

## Getting Started

### Starting the Backend

```bash
cd backend
python production_api.py
```

The API will start at `http://localhost:8000`

### Starting the Frontend

```bash
cd frontend/control_center
npm run dev
```

The frontend will start at `http://localhost:3000`

## Accessing Milestones

Navigate to: **http://localhost:3000/milestones**

## User Roles & Permissions

| Role | Create | Submit for Approval | Approve/Reject |
|------|--------|---------------------|-----------------|
| Operator | ✓ | ✓ | ✗ |
| Supervisor | ✓ | ✓ | ✓ |
| Admin | ✓ | ✓ | ✓ |

## Creating a Milestone

1. Click the **"Create Milestone"** button
2. Fill in the required fields:
   - **Title**: A brief description of the milestone
   - **Description**: Detailed explanation
   - **Type**: Development, Incident Case, or Evidence Review
   - **Priority**: Low, Medium, High, or Critical
3. Optionally set:
   - **Assigned To**: Username of responsible person
   - **Due Date**: Target completion date
   - **Linked Incident/Evidence**: For tracking related items
4. Click **"Create Milestone"**

## Milestone Workflow

### 1. Draft Status
- Initial state after creation
- Can be edited or deleted
- Not visible to mentors for approval

### 2. In Progress Status
- Work has started
- Can be edited
- Can be submitted for approval when complete

### 3. Pending Approval
- Submitted for mentor review
- Cannot be edited
- Waiting for supervisor/admin decision

### 4. Approved
- Mentor has approved the milestone
- Marked as complete
- Includes approval notes if provided

### 5. Rejected
- Mentor has rejected the milestone
- Includes rejection reason
- Can be updated and resubmitted

### 6. Cancelled
- Milestone abandoned
- No further action required

## Submitting for Approval

When a milestone is complete:

1. Click **"Submit for Approval"** on the milestone card
2. The status changes to "Pending Approval"
3. A notification is sent to supervisors/admins

## Approving/Rejecting (Supervisors/Admins Only)

When viewing a pending milestone:

1. Click **"Approve"** to approve, or **"Reject"** to reject
2. If rejecting, provide a reason in the modal
3. The milestone status updates accordingly

## Filtering & Searching

### Filter by Status
- All, Draft, In Progress, Pending Approval, Approved, Rejected

### Filter by Type
- All, Development, Incident Case, Evidence Review

### Search
- Search by title, description, or assignee

## API Examples

### Create Milestone
```bash
curl -X POST http://localhost:8000/api/milestones \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement user authentication",
    "description": "Add JWT-based auth system",
    "type": "development",
    "priority": "high",
    "created_by": "operator_01",
    "assigned_to": "developer_01"
  }'
```

### Submit for Approval
```bash
curl -X POST http://localhost:8000/api/milestones/ms_001/submit-for-approval \
  -H "Content-Type: application/json" \
  -d '{"submitted_by": "operator_01"}'
```

### Approve Milestone (Supervisor/Admin)
```bash
curl -X POST http://localhost:8000/api/milestones/ms_001/approve \
  -H "Content-Type: application/json" \
  -d '{
    "approved_by": "supervisor_01",
    "user_role": "supervisor",
    "notes": "All requirements met"
  }'
```

### Reject Milestone (Supervisor/Admin)
```bash
curl -X POST http://localhost:8000/api/milestones/ms_001/reject \
  -H "Content-Type: application/json" \
  -d '{
    "rejected_by": "supervisor_01",
    "user_role": "supervisor",
    "reason": "Missing unit tests"
  }'
```

## Mock Data

The system includes pre-populated mock milestones for demonstration:
- ms_001: Completed development task (Approved)
- ms_002: Evidence review in progress
- ms_003: Incident case pending approval
- ms_004: New development task (Draft)

## WebSocket Events

Real-time updates are broadcast via WebSocket:
- `milestone_created`
- `milestone_updated`
- `milestone_status_updated`
- `milestone_submitted_for_approval`
- `milestone_approved`
- `milestone_rejected`
- `milestone_deleted`

## Troubleshooting

### Can't submit for approval
- Ensure milestone is in "Draft" or "In Progress" status

### Can't approve/reject
- Ensure your user role is "supervisor" or "admin"

### Changes not appearing
- Click the refresh button to reload the list
- Check browser console for errors
- Verify backend is running

---

For additional support, contact: support@overwatch.go.ke
