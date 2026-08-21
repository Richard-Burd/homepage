This image shows a bar chart that you are going to build. It will be `TechStackBar.tsx` You can use raw D3, or reach recharts, or NIVO if possible, whatever is easiest for you.

This bar chart has 3 tiers. There will always be three tiers so you can hard code that part. The highest tier is the one on the left, this is the 1st tier. The order the tier’s children occur in is based on their ordering in the JSON data file that is used to generate the file. The top tier (1st tier) has a name, I show “Full Stack Web development” - all names will be dynamic and editable. All bar colors will also be editable as well.

To the right of the 1st tier is the 2nd tier. There I show 4 separate children (e.g. UX/UI Design, Frontend, etc.) The order of these children is set by their order in the JSON data file from which they originate.

To the right of the 2nd tier is the 3rd tier. The depth of the bars in the third tier is based on the `”value”` key, and works in the same way as these files in the `/data` directory. When you create the data file, the total of the 3rd tier bars should add up to 100. There is no need for `”pieOrder”` though, as that will be set by the order in the JSON data file.

The widths of the individual bars should be the same as this component: `components/pie-and-bar-chart-combo/BarChartMobile.tsx` - so it will be that width x 3 + a bit of space in between the bars as shown.

The heights of the 3rd tier bars are determined by the `”value”` keys. The height of the 3rd tier defines the height of the 2nd tier parent bar. The bar height of the 2nd tier in turn determines the height of the 1st tier, which is the total of all its children, with space in between the children as shown. The mobile & desktop versions will be exactly the same.

Only the 1st and 2nd tier bars will need Hebrew & Arabic translations. The tech tools in the 3rd tier are always translated into Latin script, so take this into account as you architect this component. Also, the Arabic & Hebrew versions will be left-justified just like the English, so there is no need to worry about shifting the bar to the right as we do with the other bar charts.

There will be additional uses of this component, besides the “Full Stack Web Development” instance, so don’t hard-code that title into the `.tsx` component.

When the user scrolls down to the component, it will animate in the following fashion: The 1st tier will move from left to right, as the user scrolls down, and the 2nd tier comes into view, it will transition from left to right so as to appear to “pop-out” of the 1st tier parent bar. Simultaneously, the 3rd tier bars will appear to pop out of the 2nd tier parent bar right after that. The remaining 2nd (& 3rd) tier bars will remain hidden until the user scrolls down to view them, when they will animate into place as the previous ones described above.
