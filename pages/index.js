import * as blockstack from "blockstack";

const Index = () => (
  <div>
    <h1>bin</h1>
    <button onClick={() => blockstack.redirectToSignIn()}>sign in</button>
  </div>
);

Index.getInitialProps = async function() {
  return {
    files: []
  };
};

export default Index;
