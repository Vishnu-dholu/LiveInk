const Section = ({ title, children }) => (
  <section className="space-y-3">
    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 border-b pb-1 border-gray-300 dark:border-gray-700">
      {title}
    </h3>
    {children}
  </section>
);

export default Section;
