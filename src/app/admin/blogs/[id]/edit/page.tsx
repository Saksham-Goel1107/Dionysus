import BlogEditor from '../../components/BlogEditor';

interface EditBlogPageProps {
  params: {
    id: string;
  };
}

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const awaitedParams = await params;
  return <BlogEditor blogId={awaitedParams.id} isEdit={true} />;
}
