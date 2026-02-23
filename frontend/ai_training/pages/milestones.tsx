import Layout from '@/components/Layout'
import MilestoneList from '@/components/MilestoneList'

export default function Milestones() {
  return (
    <Layout title="Kenya Overwatch - Milestones">
      <MilestoneList userRole="supervisor" currentUser="operator_01" />
    </Layout>
  )
}
